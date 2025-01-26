"use client"
import React, { useState, useEffect } from 'react';
import { Rocket, Coins, Users, TrendingUp, Shield, Wallet } from 'lucide-react';
import { ethers } from 'ethers';
import { 
  createToken, 
  buyToken, 
  getTokenDetails 
} from '../utils/contractInteractions';

interface Token {
  name: string;
  symbol: string;
  address: string;
  price: number;
  sold: number;
  raised: number;
  isOpen: boolean;
}

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  
  // Token Creation Form State
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenSymbol, setNewTokenSymbol] = useState('');
  
  // Token Purchase Form State
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [purchaseAmount, setPurchaseAmount] = useState('');

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
  
        const eduChainTestnet = {
          chainId: '0xa045c',
          chainName: 'EDU Chain Testnet',
          nativeCurrency: {
            name: 'Edu Token',
            symbol: 'EDU',
            decimals: 18
          },
          rpcUrls: ['https://rpc.open-campus-codex.gelato.digital'],
          blockExplorerUrls: ['https://edu-chain-testnet.blockscout.com']
        };
  
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: eduChainTestnet.chainId }]
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [eduChainTestnet]
            });
          } else {
            throw switchError;
          }
        }
  
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
  
        setWalletAddress(accounts[0]);
        setSigner(signer);
  
        return accounts[0];
      } catch (error) {
        console.error('Wallet connection failed', error);
        alert('Failed to connect wallet. Please try again.');
        return null;
      }
    } else {
      alert('MetaMask not found. Please install MetaMask.');
      return null;
    }
  };

  const handleTokenCreation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer) {
      alert('Please connect wallet first');
      return;
    }

    try {
      const tokenAddress = await createToken(signer, newTokenName, newTokenSymbol);
      
      if (tokenAddress) {
        const tokenDetails = await getTokenDetails(tokenAddress);
        
        if (tokenDetails) {
          const newToken: Token = {
            name: tokenDetails.name,
            symbol: tokenDetails.symbol,
            address: tokenAddress,
            price: 0.0001, // Initial price from contract
            sold: 0,
            raised: 0,
            isOpen: true
          };

          setTokens(prevTokens => [...prevTokens, newToken]);
          alert('Token created successfully!');
          
          // Reset form
          setNewTokenName('');
          setNewTokenSymbol('');
        }
      }
    } catch (error) {
      console.error('Token creation error', error);
      alert('Failed to create token');
    }
  };

  const handleTokenPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer || !selectedToken) {
      alert('Please connect wallet and select a token');
      return;
    }

    try {
      // Convert purchase amount to wei (1 ether = 10^18 wei)
      const amountInWei = ethers.utils.parseEther(purchaseAmount);
      
      await buyToken(signer, selectedToken, amountInWei.toNumber());
      alert('Token purchase successful');
      
      // Optionally refresh token details or update UI
      setPurchaseAmount('');
      setSelectedToken(null);
    } catch (error) {
      console.error('Token purchase error', error);
      alert('Token purchase failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-black text-white">
      <header className="border-b border-purple-800/30 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Rocket className="w-8 h-8 text-purple-400" />
            <span className="text-2xl font-bold">WIWON</span>
          </div>
          <button 
            className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg flex items-center space-x-2" 
            onClick={connectWallet}
          >
            <Wallet className="w-5 h-5" />
            <span>{walletAddress ? 'Connected' : 'Connect Wallet'}</span>
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
        {/* Token Creation Form */}
        <div className="bg-purple-900/20 p-6 rounded-xl border border-purple-800/30">
          <h2 className="text-2xl font-bold mb-4">Create New Token</h2>
          <form onSubmit={handleTokenCreation} className="space-y-4">
            <input 
              type="text" 
              placeholder="Token Name" 
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              className="w-full p-2 bg-purple-800/50 rounded-lg"
              required 
            />
            <input 
              type="text" 
              placeholder="Token Symbol" 
              value={newTokenSymbol}
              onChange={(e) => setNewTokenSymbol(e.target.value)}
              className="w-full p-2 bg-purple-800/50 rounded-lg"
              required 
            />
            <button 
              type="submit" 
              disabled={!walletAddress}
              className="w-full bg-green-600 hover:bg-green-700 p-2 rounded-lg disabled:opacity-50"
            >
              Create Token
            </button>
          </form>
        </div>

        {/* Token Purchase Form */}
        <div className="bg-purple-900/20 p-6 rounded-xl border border-purple-800/30">
          <h2 className="text-2xl font-bold mb-4">Buy Tokens</h2>
          <form onSubmit={handleTokenPurchase} className="space-y-4">
            <select 
              value={selectedToken || ''}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="w-full p-2 bg-purple-800/50 rounded-lg"
              required
            >
              <option value="">Select Token</option>
              {tokens.map(token => (
                <option key={token.address} value={token.address}>
                  {token.name} ({token.symbol})
                </option>
              ))}
            </select>
            <input 
              type="number" 
              placeholder="Amount to Buy (in ETH)" 
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
              className="w-full p-2 bg-purple-800/50 rounded-lg"
              min="0.001"
              step="0.001"
              required 
            />
            <button 
              type="submit" 
              disabled={!walletAddress || !selectedToken}
              className="w-full bg-purple-600 hover:bg-purple-700 p-2 rounded-lg disabled:opacity-50"
            >
              Buy Tokens
            </button>
          </form>
        </div>

        {/* Token List */}
        <div className="md:col-span-2 bg-purple-900/10 p-6 rounded-xl border border-purple-800/30">
          <h2 className="text-2xl font-bold mb-4">Token Launches</h2>
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-purple-800/30">
                <th className="pb-4">Token</th>
                <th className="pb-4">Price</th>
                <th className="pb-4">Tokens Sold</th>
                <th className="pb-4">Raised</th>
                <th className="pb-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token) => (
                <tr key={token.address} className="border-b border-purple-800/10">
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-8 h-8 text-purple-400" />
                      <div>
                        <div className="font-semibold">{token.name}</div>
                        <div className="text-sm text-gray-400">{token.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td>${token.price.toFixed(6)}</td>
                  <td>{token.sold.toLocaleString()}</td>
                  <td>${token.raised.toLocaleString()}</td>
                  <td>
                    <span className={`px-2 py-1 rounded-full text-xs ${token.isOpen ? 'bg-green-600' : 'bg-red-600'}`}>
                      {token.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}