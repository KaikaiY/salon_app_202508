import { Calendar } from '@fullcalendar/core';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import jaLocale from '@fullcalendar/core/locales/ja';

document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) return;

  // 予約更新（ドラッグ or リサイズ時）
  function updateEvent(event) {
    fetch(`/reservations/${event.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
      },
      body: JSON.stringify({
        reservation: {
          title: event.title,
          start: event.start.toISOString(),
          end: event.end ? event.end.toISOString() : null
        }
      })
    }).then(response => {
      if (!response.ok) {
        alert('更新に失敗しました');
      }
    });
  }

  // 外部ドラッグ可能設定
  const externalEl = document.getElementById('external-events');
  if (externalEl) {
    new Draggable(externalEl, {
      itemSelector: '.fc-event',
      eventData: function (eventEl) {
        return {
          title: eventEl.innerText.trim()
        };
      }
    });
  }

  const calendar = new Calendar(calendarEl, {
    plugins: [timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    slotDuration: '00:20:00',
    editable: true,
    droppable: true,
    selectable: false,
    eventDurationEditable: false,
    locale: jaLocale,
    height: 'auto',
    // ここを追加
    slotMinTime: '10:00:00',
    slotMaxTime: '17:00:00',
    slotDuration: '00:20:00',
    expandRows: true, // 👈 これを追加することでスロットの縦幅が広がる
     
    eventSources: [
      {
        url: '/reservations',
        method: 'GET',
        failure: () => alert('予約データの読み込みに失敗しました')
      }
    ],

    // ドラッグして追加
    drop: function(info) {
      const title = info.draggedEl.innerText.trim();
      const start = info.date;
      const end = new Date(start.getTime() + 20 * 60000); // 20分固定

      fetch('/reservations', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          reservation: {
            title: title,
            start: start.toISOString(),
            end: end.toISOString()
          }
        })
      })
        .then(response => response.json())
        .then(data => {
          calendar.refetchEvents(); // ← これで本物を表示
          info.revert(); // ← 仮表示されたイベントをキャンセル
        })
        .catch(() => {
          alert('予約作成に失敗しました');
          info.revert(); // エラー時も戻す
        });
    },

    // イベントをクリック → 削除確認
    eventClick: function(info) {
      const start = info.event.start.toLocaleString();
      const end = info.event.end ? info.event.end.toLocaleString() : '未定';
      const message = `施術名: ${info.event.title}\n施術開始: ${start}\n施術終了: ${end}\n\nこの予約を削除しますか？`;

      if (confirm(message)) {
        fetch(`/reservations/${info.event.id}`, {
          method: 'DELETE',
          headers: {
            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
          }
        }).then(response => {
          if (response.ok) {
            info.event.remove();
            alert('削除しました');
          } else {
            alert('削除に失敗しました');
          }
        });
      }
    },

    eventDrop: function(info) {
      updateEvent(info.event);
    },

    eventResize: function(info) {
      updateEvent(info.event);
    }
  });

console.log('calendar render 実行');
calendar.render();

});
