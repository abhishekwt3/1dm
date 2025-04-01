// components/SubscriptionForm.jsx
export default function SubscriptionForm({
    equipment,
    onClose,
    formData,
    handleFormChange,
    handleSubmit,
    locations,
    submitError,
    submitting
  }) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 p-4">
        <div className="bg-white rounded-lg w-full max-h-[90vh] overflow-y-auto">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-bold text-black">Subscribe to Equipment</h2>
            <button 
              onClick={onClose}
              className="text-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-4">
            {/* Error message */}
            {submitError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-sm">
                <p className="font-bold">Error</p>
                <p>{submitError}</p>
              </div>
            )}
            
            <div className="mb-4">
              <h3 className="font-semibold text-black">{equipment.name}</h3>
              <p className="text-sm text-black mt-1">{equipment.description}</p>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1 text-black">
                  Subscription Type
                </label>
                <select 
                  name="subscriptionType"
                  value={formData.subscriptionType}
                  onChange={handleFormChange}
                  className="w-full p-2 border rounded-md bg-white text-black"
                >
                  <option value="WEEKLY">Weekly (Rs {equipment.weekly_price})</option>
                  <option value="MONTHLY">Monthly (Rs {equipment.monthly_price})</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-black">
                  Pickup Location
                </label>
                <select
                  name="pickupLocation"
                  value={formData.pickupLocation}
                  onChange={handleFormChange}
                  className="w-full p-2 border rounded-md bg-white text-black"
                >
                  <option value="">Select location</option>
                  {locations.map(location => (
                    <option key={`pickup-${location.id}`} value={location.name}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-black">
                  Drop-off Location
                </label>
                <select
                  name="dropLocation"
                  value={formData.dropLocation}
                  onChange={handleFormChange}
                  className="w-full p-2 border rounded-md bg-white text-black"
                >
                  <option value="">Select location</option>
                  {locations.map(location => (
                    <option key={`drop-${location.id}`} value={location.name}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-black">
                  Payment Method
                </label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="payment-cod"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={handleFormChange}
                      className="mr-2"
                    />
                    <label htmlFor="payment-cod" className="text-black">Cash on Delivery (COD)</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="payment-online"
                      name="paymentMethod"
                      value="online"
                      checked={formData.paymentMethod === 'online'}
                      onChange={handleFormChange}
                      className="mr-2"
                    />
                    <label htmlFor="payment-online" className="text-black">Online Payment (Razorpay)</label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t space-y-2">
              <div className="flex justify-between text-sm text-black">
                <span>Subscription Price</span>
                <span>
                  Rs {formData.subscriptionType === 'WEEKLY' 
                    ? equipment.weekly_price
                    : equipment.monthly_price}
                </span>
              </div>
              <div className="flex justify-between text-sm text-black">
                <span>Security Deposit</span>
                <span>Rs {equipment.deposit_amount}</span>
              </div>
              <div className="flex justify-between text-sm text-black">
                <span>Delivery Fee</span>
                <span>Rs 100</span>
              </div>
              <div className="pt-2 border-t flex justify-between font-bold text-black">
                <span>Total</span>
                <span>
                  Rs {(
                    (formData.subscriptionType === 'WEEKLY' 
                      ? equipment.weekly_price 
                      : equipment.monthly_price) + 
                    equipment.deposit_amount + 
                    100
                  )}
                </span>
              </div>
            </div>
            
            <button 
              onClick={handleSubmit}
              disabled={!formData.pickupLocation || !formData.dropLocation || submitting}
              className={`w-full ${submitting ? 'bg-amber-400' : 'bg-amber-600'} text-white py-2 rounded-md mt-4 font-medium disabled:opacity-50`}
            >
              {submitting ? 'Processing...' : 'Confirm Subscription'}
            </button>
          </div>
        </div>
      </div>
    );
  }