class ReservationsController < ApplicationController
  protect_from_forgery with: :null_session  # JavaScriptからPOSTするため

  def index
    @reservations = Reservation.all
    render json: @reservations
  end

  def create
    @reservation = Reservation.new(reservation_params)
    if @reservation.save
      render json: @reservation, status: :created
    else
      render json: { errors: @reservation.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    reservation = Reservation.find(params[:id])
    if reservation.update(reservation_params)
        render json: { status: 'updated' }
    else
        render json: { error: '更新に失敗しました' }, status: :unprocessable_entity
    end
  end
  def destroy
    reservation = Reservation.find(params[:id])
    reservation.destroy
    head :no_content
  end


  private

  def reservation_params
    params.require(:reservation).permit(:title, :start, :end)
  end
end
