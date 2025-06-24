// src/components/cards/LastPlayerCard.jsx
import React from 'react';

const LastPlayerCard = ({ lastPlayer }) => {
  if (!lastPlayer) return null;

  return (
    <div className="card last-added">
      <h3 className="card-title">Last Added ({lastPlayer.roundContext})</h3>
      <div className="card-content">
        <p className="last-added-line">{lastPlayer.accountNumber}, {lastPlayer.name}</p>
        <p className="last-added-line">{lastPlayer.purchases}</p>
      </div>
    </div>
  );
};

export default LastPlayerCard;