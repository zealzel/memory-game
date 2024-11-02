import React, { useState, useEffect } from 'react';
import Card from './components/Card';
import './App.css';

function App() {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [isGameWon, setIsGameWon] = useState(false);

  const getDifficultyCount = () => {
    switch(difficulty) {
      case 'easy': return 8;
      case 'medium': return 18;
      case 'hard': return 32;
      default: return 18;
    }
  };

  const initializeGame = () => {
    const cardCount = getDifficultyCount();
    const imageCount = cardCount / 2;
    const imageNumbers = Array.from({ length: 16 }, (_, i) => i + 1);
    
    const shuffledImages = imageNumbers.sort(() => Math.random() - 0.5);
    const gameImages = shuffledImages.slice(0, imageCount);
    const duplicatedImages = [...gameImages, ...gameImages];
    
    const shuffledCards = duplicatedImages
      .sort(() => Math.random() - 0.5)
      .map((imageNumber, index) => ({
        id: index,
        imageNumber: imageNumber,
        isFlipped: false,
      }));

    setCards(shuffledCards);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setGameTime(0);
    setIsPlaying(true);
    setIsGameWon(false);
  };

  useEffect(() => {
    let timer;
    if (isPlaying && !isGameWon) {
      timer = setInterval(() => {
        setGameTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, isGameWon]);

  useEffect(() => {
    if (matched.length > 0 && matched.length === cards.length) {
      setIsGameWon(true);
      setIsPlaying(false);
    }
  }, [matched, cards]);

  const handleCardClick = (cardId) => {
    if (flipped.length === 2 || isGameWon) return;
    if (matched.includes(cardId)) return;
    
    setFlipped(prev => [...prev, cardId]);
    setMoves(prev => prev + 1);
    
    if (flipped.length === 1) {
      const firstCard = cards.find(card => card.id === flipped[0]);
      const secondCard = cards.find(card => card.id === cardId);
      
      if (firstCard.imageNumber === secondCard.imageNumber) {
        setMatched(prev => [...prev, flipped[0], cardId]);
      }
      
      setTimeout(() => setFlipped([]), 1000);
    }
  };

  return (
    <div className="App">
      <h1>記憶遊戲</h1>
      
      <div className="game-controls">
        <select 
          value={difficulty} 
          onChange={(e) => setDifficulty(e.target.value)}
          disabled={isPlaying}
        >
          <option value="easy">簡單</option>
          <option value="medium">中等</option>
          <option value="hard">困難</option>
        </select>
        <button onClick={initializeGame}>
          {isPlaying ? '重新開始' : '開始遊戲'}
        </button>
      </div>

      <div className="game-stats">
        <p>步數: {moves}</p>
        <p>時間: {Math.floor(gameTime / 60)}:{(gameTime % 60).toString().padStart(2, '0')}</p>
      </div>

      {isGameWon && (
        <div className="win-message">
          <h2>恭喜你贏了！</h2>
          <p>總步數：{moves}</p>
          <p>完成時間：{Math.floor(gameTime / 60)}分{gameTime % 60}秒</p>
          <button onClick={initializeGame}>再玩一次</button>
        </div>
      )}

      <div className={`game-board difficulty-${difficulty}`}>
        {cards.map(card => (
          <Card
            key={card.id}
            id={card.id}
            imageNumber={card.imageNumber}
            isFlipped={flipped.includes(card.id) || matched.includes(card.id)}
            onClick={() => handleCardClick(card.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default App; 