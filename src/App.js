import React, { useState, useEffect, useRef } from 'react';
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
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [leaderboard, setLeaderboard] = useState(() => {
    const saved = localStorage.getItem('leaderboard');
    return saved ? JSON.parse(saved) : {};
  });
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // 新增音效相關的 refs
  const bgmEasyRef = useRef(new Audio(`${process.env.PUBLIC_URL}/audio/bgm-easy.mp3`));
  const bgmMediumRef = useRef(new Audio(`${process.env.PUBLIC_URL}/audio/bgm-medium.mp3`));
  const bgmHardRef = useRef(new Audio(`${process.env.PUBLIC_URL}/audio/bgm-hard.mp3`));
  const flipSoundRef = useRef(new Audio(`${process.env.PUBLIC_URL}/audio/flip.mp3`));
  const startSoundRef = useRef(new Audio(`${process.env.PUBLIC_URL}/audio/start.mp3`));
  const winSoundRef = useRef(new Audio(`${process.env.PUBLIC_URL}/audio/win.mp3`));
  
  const [isMuted, setIsMuted] = useState(false);

  // 載入排行榜
  useEffect(() => {
    const saved = localStorage.getItem('leaderboard');
    if (saved) {
      setLeaderboard(JSON.parse(saved));
    }
  }, []);

  // 保存排行榜
  const saveToLeaderboard = () => {
    const score = {
      name: playerName,
      moves: moves,
      time: gameTime,
      date: new Date().toISOString()
    };

    const newLeaderboard = {
      ...leaderboard,
      [difficulty]: [...(leaderboard[difficulty] || []), score]
        .sort((a, b) => {
          if (a.moves !== b.moves) {
            return a.moves - b.moves;
          }
          return a.time - b.time;
        })
        .slice(0, 10) // 只保留前10名
    };

    setLeaderboard(newLeaderboard);
    localStorage.setItem('leaderboard', JSON.stringify(newLeaderboard));
  };

  const startGame = () => {
    if (!playerName.trim()) {
      setShowNameInput(true);
      return;
    }
    initializeGame();
  };

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (playerName.trim()) {
      setShowNameInput(false);
      initializeGame();
    }
  };

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
    
    if (!isMuted) {
      startSoundRef.current.play().catch(e => console.log('Start sound autoplay prevented'));
    }
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
      saveToLeaderboard();
      
      if (!isMuted) {
        winSoundRef.current.play().catch(e => console.log('Win sound autoplay prevented'));
      }
    }
  }, [matched, cards]);

  const handleCardClick = (cardId) => {
    if (flipped.length === 2 || isGameWon) return;
    if (matched.includes(cardId)) return;
    
    if (!isMuted) {
      flipSoundRef.current.currentTime = 0;
      flipSoundRef.current.play().catch(e => console.log('Flip sound autoplay prevented'));
    }
    
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

  const formatTime = (seconds) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  // 新增：重置排行榜函數
  const resetLeaderboard = () => {
    if (window.confirm('確定要刪除所有遊戲記錄嗎？此操作無法復原。')) {
      setLeaderboard({});
      localStorage.removeItem('leaderboard');
    }
  };

  // 新增：返回主選單函數
  const backToMenu = () => {
    setIsPlaying(false);
    setIsGameWon(false);
    setCards([]);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setGameTime(0);
  };

  // 設置背景音樂循環播放
  useEffect(() => {
    [bgmEasyRef, bgmMediumRef, bgmHardRef].forEach(ref => {
      ref.current.loop = true;
    });
  }, []);

  // 控制背景音樂
  useEffect(() => {
    const stopAllBgm = () => {
      [bgmEasyRef, bgmMediumRef, bgmHardRef].forEach(ref => {
        ref.current.pause();
        ref.current.currentTime = 0;
      });
    };

    if (isPlaying && !isMuted) {
      stopAllBgm();
      const currentBgm = {
        easy: bgmEasyRef,
        medium: bgmMediumRef,
        hard: bgmHardRef
      }[difficulty];
      
      currentBgm.current.play().catch(e => console.log('BGM autoplay prevented'));
    } else {
      stopAllBgm();
    }

    return () => stopAllBgm();
  }, [isPlaying, difficulty, isMuted]);

  // 新增音量控制按鈕
  const toggleMute = () => {
    setIsMuted(!isMuted);
    [bgmEasyRef, bgmMediumRef, bgmHardRef, flipSoundRef, startSoundRef, winSoundRef]
      .forEach(ref => {
        ref.current.muted = !isMuted;
      });
  };

  const LeaderboardView = ({ onClose }) => (
    <div className="leaderboard-overlay">
      <div className="leaderboard-modal">
        <h2>遊戲排行榜</h2>
        <div className="difficulty-tabs">
          <button 
            className={difficulty === 'easy' ? 'active' : ''} 
            onClick={() => setDifficulty('easy')}
            disabled={isPlaying}
          >
            簡單
          </button>
          <button 
            className={difficulty === 'medium' ? 'active' : ''} 
            onClick={() => setDifficulty('medium')}
            disabled={isPlaying}
          >
            中等
          </button>
          <button 
            className={difficulty === 'hard' ? 'active' : ''} 
            onClick={() => setDifficulty('hard')}
            disabled={isPlaying}
          >
            困難
          </button>
        </div>
        <div className="leaderboard-content">
          <h3>
            {difficulty === 'easy' ? '簡單' : difficulty === 'medium' ? '中等' : '困難'} 模式排行榜
            {isPlaying && <span className="current-game-note">（遊戲進行中無法切換難度）</span>}
          </h3>
          <div className="leaderboard-list">
            <div className="leaderboard-header">
              <span>排名</span>
              <span>玩家</span>
              <span>步數</span>
              <span>時間</span>
              <span>日期</span>
            </div>
            {leaderboard[difficulty]?.map((score, index) => (
              <div key={index} className={`leaderboard-item ${index < 3 ? `rank-${index + 1}` : ''}`}>
                <span>#{index + 1}</span>
                <span>{score.name}</span>
                <span>{score.moves}步</span>
                <span>{formatTime(score.time)}</span>
                <span>{new Date(score.date).toLocaleDateString()}</span>
              </div>
            )) || <div className="no-records">暫無記錄</div>}
          </div>
        </div>
        <div className="leaderboard-buttons">
          <button 
            className="reset-button" 
            onClick={() => {
              if (window.confirm(`確定要刪除${difficulty === 'easy' ? '簡單' : difficulty === 'medium' ? '中等' : '困難'}難度的所有記錄嗎？此操作無法復原。`)) {
                const newLeaderboard = { ...leaderboard };
                delete newLeaderboard[difficulty];
                setLeaderboard(newLeaderboard);
                localStorage.setItem('leaderboard', JSON.stringify(newLeaderboard));
              }
            }}
          >
            重置當前難度記錄
          </button>
          <button className="close-button" onClick={onClose}>
            關閉
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="App">
      <h1>記憶遊戲</h1>
      
      {/* 添加音量控制按鈕 */}
      <button 
        className="sound-toggle"
        onClick={toggleMute}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>

      {showNameInput ? (
        <div className="name-input-overlay">
          <form onSubmit={handleNameSubmit} className="name-input-form">
            <h2>請輸入您的名字</h2>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="您的名字"
              maxLength={20}
              required
            />
            <button type="submit">開始遊戲</button>
          </form>
        </div>
      ) : showLeaderboard ? (
        <LeaderboardView onClose={() => setShowLeaderboard(false)} />
      ) : (
        <>
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
            <button onClick={startGame}>
              {isPlaying ? '重新開始' : '開始遊戲'}
            </button>
            <button 
              className="leaderboard-button"
              onClick={() => setShowLeaderboard(true)}
            >
              排行榜
            </button>
          </div>

          <div className="game-stats">
            <p>玩家: {playerName}</p>
            <p>步數: {moves}</p>
            <p>時間: {Math.floor(gameTime / 60)}:{(gameTime % 60).toString().padStart(2, '0')}</p>
          </div>

          {isGameWon && (
            <div className="win-message">
              <h2>恭喜你贏了！</h2>
              <p>玩家：{playerName}</p>
              <p>總步數：{moves}</p>
              <p>完成時間：{Math.floor(gameTime / 60)}分{gameTime % 60}秒</p>
              <div className="leaderboard">
                <h3>排行榜 ({difficulty})</h3>
                <div className="leaderboard-list">
                  {leaderboard[difficulty]?.map((score, index) => (
                    <div key={index} className="leaderboard-item">
                      <span>#{index + 1}</span>
                      <span>{score.name}</span>
                      <span>{score.moves}步</span>
                      <span>{Math.floor(score.time / 60)}:{(score.time % 60).toString().padStart(2, '0')}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="win-buttons">
                <button onClick={startGame}>再玩一次</button>
                <button onClick={backToMenu} className="menu-button">返回主選單</button>
              </div>
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
        </>
      )}
    </div>
  );
}

export default App;