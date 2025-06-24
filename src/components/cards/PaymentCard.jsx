// src/components/cards/PaymentCard.jsx
import React from 'react';

const PaymentCard = ({
  activeTab,
  selectedRound,
  paymentType,
  setPaymentType,
  paymentAmount,
  setPaymentAmount,
  splitPayment,
  setSplitPayment,
  paymentType2,
  setPaymentType2,
  paymentAmount2,
  setPaymentAmount2,
  currentPlayer,
  currentTournament,
  getPaymentTypes,
  handlePaymentTypeChange
}) => {
  const isRegistration = activeTab === 'registration' || (activeTab === 'post-registration' && selectedRound === 'round1');
  const cardTitle = isRegistration ? 'Payment' : 'Rebuy Payment';
  const paymentTypeLabel = isRegistration ? 'Payment Type' : 'Rebuy Payment Type';
  const amountLabel = isRegistration ? 'Amount' : 'Rebuy Amount';
  const splitLabel = isRegistration ? 'Split Payment' : 'Split Rebuy Payment';
  const paymentType2Label = isRegistration ? 'Payment Type 2' : 'Rebuy Payment Type 2';
  const amount2Label = isRegistration ? 'Amount 2' : 'Rebuy Amount 2';

  return (
    <div className="card mb-4">
      <div className="card-title">{cardTitle}</div>

      {/* Payment Type + Amount Row */}
      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1 }}>
          <div className="form-group">
            <label className="mb-2">{paymentTypeLabel}</label>
            <select
              value={paymentType}
              onChange={(e) => handlePaymentTypeChange(e.target.value)}
              className="select-field"
              disabled={isRegistration && currentPlayer?.EntryType === 'COMP'}
            >
              <option value="">-- Select payment type --</option>
              {getPaymentTypes().map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div className="form-group">
            <label className="mb-2">{amountLabel}</label>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="input-field"
              disabled={paymentType === 'Comp'}
              placeholder={
                isRegistration
                  ? currentTournament.entryCost.toString()
                  : currentTournament.rebuyCost.toString()
              }
            />
          </div>
        </div>
      </div>

      {/* Split Payment Checkbox */}
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={splitPayment}
            disabled={paymentType === 'Comp'}
            onChange={(e) => setSplitPayment(e.target.checked)}
          />
          {' '}
          {splitLabel}
        </label>
      </div>

      {/* Split Payment Fields */}
      {splitPayment && (
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <div className="form-group">
              <label className="mb-2">{paymentType2Label}</label>
              <select
                value={paymentType2}
                onChange={(e) => setPaymentType2(e.target.value)}
                className="select-field"
              >
                <option value="">-- Select payment type --</option>
                {getPaymentTypes().map((type) => (
                  <option
                    key={type}
                    value={type}
                    disabled={type === paymentType}
                  >
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="form-group">
              <label className="mb-2">{amount2Label}</label>
              <input
                type="number"
                value={paymentAmount2}
                onChange={(e) => setPaymentAmount2(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentCard;