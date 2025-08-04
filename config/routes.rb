Rails.application.routes.draw do
  get 'calendar', to: 'pages#calendar'
resources :reservations, only: [:index, :create, :update, :destroy]
end
