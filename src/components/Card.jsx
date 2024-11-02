import React from 'react';
import './Card.css';

const Card = ({ id, imageNumber, isFlipped, onClick }) => {
  return (
    <div 
      className={`card ${isFlipped ? 'flipped' : ''}`} 
      onClick={onClick}
    >
      <div className="card-inner">
        <div className="card-front">
          <span className="question-mark">❓</span>
        </div>
        <div className="card-back">
          <img 
            src={`${process.env.PUBLIC_URL}/img/${imageNumber.toString().padStart(2, '0')}.png`}
            alt="card"
            className="card-image"
          />
        </div>
      </div>
    </div>
  );
};

export default Card; 