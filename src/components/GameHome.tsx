"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { GameLevel, GAME_LEVELS } from '@/types/game';
import { Play, Trophy, Clock, Target, Zap, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Declare window.ethereum type
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<string[]>;
      selectedAddress: string | null;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}


interface GameHomeProps {
  onStartGame: (playerName: string, level: GameLevel) => void;
}

export function GameHome({ onStartGame}: GameHomeProps) {
  const [playerName, setPlayerName] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<GameLevel>(GAME_LEVELS[0]);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const { toast } = useToast();

  
  // 👉 THÊM Ở ĐÂY — ngay dưới các useState ở trên
  const [showWalletPopup, setShowWalletPopup] = useState(false);

  const handleWalletButtonClick = () => {
    // Nếu chưa kết nối thì gọi connect
    if (!isWalletConnected) {
      handleConnectWallet();
    } else {
      // Nếu đã kết nối thì bật/tắt popup
      setShowWalletPopup((prev) => !prev);
    }
  };

  const disconnectWallet = () => {
    setIsWalletConnected(false);
    setWalletAddress(null);
    setShowWalletPopup(false);
    toast({
      title: "Đã ngắt kết nối ví 🏷️",
      description: "Bạn có thể kết nối lại bất cứ lúc nào.",
    });
  };
  // 👆 THÊM 3 HÀM NÀY TRƯỚC handleConnectWallet

  const handleStartGame = () => {
    if (playerName.trim() && selectedLevel) {
      onStartGame(playerName.trim(), selectedLevel);
    }
  };

  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkWalletConnection = () => {
      if (window.ethereum?.selectedAddress) {
        setIsWalletConnected(true);
        setWalletAddress(window.ethereum.selectedAddress);
      }
    };

    checkWalletConnection();

    // Listen for account changes
    if (window.ethereum) {
      const handleAccountsChanged = (...args: unknown[]) => {
        const accounts = args[0] as string[];
        if (accounts && accounts.length > 0) {
          setIsWalletConnected(true);
          setWalletAddress(accounts[0]);
        } else {
          setIsWalletConnected(false);
          setWalletAddress(null);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, []);

  const handleConnectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask không được tìm thấy",
        description: "Vui lòng cài đặt MetaMask extension để kết nối ví.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        setIsWalletConnected(true);
        setWalletAddress(accounts[0]);
        toast({
          title: "Kết nối thành công! 🎉",
          description: `Đã kết nối với địa chỉ: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        });
      }
    } catch (error: unknown) {
      console.error('Error connecting wallet:', error);
      toast({
        title: "Kết nối thất bại",
        description: error instanceof Error ? error.message : "Không thể kết nối với MetaMask",
        variant: "destructive",
      });
    }
  };

  const formatAddress = (address: string | null) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Updated level colors to match the new design
  const getLevelColor = (levelName: string) => {
    switch (levelName) {
      case 'Dễ': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Trung bình': return 'bg-green-100 text-green-800 border-green-300';
      case 'Khó': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getLevelIcon = (levelName: string) => {
    switch (levelName) {
      case 'Dễ': return <Zap className="w-4 h-4 text-purple-600" />;
      case 'Trung bình': return <Target className="w-4 h-4 text-green-600" />;
      case 'Khó': return <Trophy className="w-4 h-4 text-yellow-600" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-game flex items-center justify-center p-4 relative">
      {/* Connect Wallet Button - Top Right */}
      <div className="fixed top-4 right-4 z-50">
  <div className="relative">
    <Button
      onClick={handleWalletButtonClick} // 👈 thay handleConnectWallet bằng hàm mới
      variant={isWalletConnected ? "default" : "outline"}
      className={`${
        isWalletConnected
          ? 'bg-green-600 hover:bg-green-700 text-white'
          : 'border-2 border-purple-300 hover:border-purple-500 bg-white'
      }`}
      size="sm"
    >
      <Wallet className="w-4 h-4 mr-2" />
      {isWalletConnected
        ? (walletAddress ? formatAddress(walletAddress) : 'Đã kết nối')
        : 'Connect Wallet'}
    </Button>

    {/* Popup hiển thị khi đã kết nối */}
    {showWalletPopup && isWalletConnected && (
      <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3 animate-fade-in">
        <p className="text-sm text-gray-700 mb-2">
          <strong>Địa chỉ:</strong><br />
          <span className="break-all text-gray-500">
            {walletAddress}
          </span>
        </p>
        <Button
          onClick={disconnectWallet}
          variant="destructive"
          size="sm"
          className="w-full"
        >
          Ngắt kết nối
        </Button>
      </div>
    )}
  </div>
</div>


      <div className="max-w-md w-full space-y-6">
        {/* Game Title */}
        <div className="text-center animate-fade-in">
            <h1 className="text-4xl font-bold text-purple-600 mb-2">
              🧠 Memory Matching Game
            </h1>
          <p className="text-muted-foreground">
            Thử thách trí nhớ của bạn!
          </p>
        </div>

        {/* Player Setup */}
        <Card className="bg-card/80 backdrop-blur-sm animate-bounce-in">
          <CardHeader>
            <CardTitle className="text-center text-purple-600">
              Bắt đầu chơi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Player Name Input */}
            <div className="space-y-2">
              <Label htmlFor="playerName">Tên của bạn</Label>
              <Input
                id="playerName"
                type="text"
                placeholder="Nhập tên của bạn..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleStartGame()}
                className="input-primary"
              />
            </div>

            {/* Level Selection */}
            <div className="space-y-3">
              <Label>Chọn độ khó</Label>
              <div className="space-y-2">
                {GAME_LEVELS.map((level) => (
                  <button
                    key={level.name}
                    onClick={() => setSelectedLevel(level)}
                    className={`level-card ${
                      selectedLevel?.name === level.name ? 'selected' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getLevelIcon(level.name)}
                        <span className="font-medium">{level.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <Badge
                          variant="outline"
                          className={getLevelColor(level.name)}
                        >
                          {level.gridSize.rows}×{level.gridSize.cols}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{level.pairs} cặp</span>
                      {level.timeLimit && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {level.timeLimit}s
                        </div>
                      )}
                      {level.moveLimit && (
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {level.moveLimit} lượt
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <Button
              onClick={handleStartGame}
              disabled={!playerName.trim() || !selectedLevel}
              className="btn-primary"
              size="lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Bắt đầu chơi
            </Button>
          </CardContent>
        </Card>

        {/* Game Rules */}
        <Card className="bg-card/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2 text-purple-600">Cách chơi:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Lật tối đa 2 thẻ mỗi lượt</li>
            <li>• Tìm các cặp hình giống nhau</li>
            <li>• Hoàn thành tất cả cặp để thắng</li>
            <li>• Chú ý giới hạn thời gian và số lượt!</li>
          </ul>
        </CardContent>
      </Card>

      </div>
    </div>
  );
}