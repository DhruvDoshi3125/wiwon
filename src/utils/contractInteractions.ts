// src/utils/contractInteractions.ts
import { ethers } from 'ethers';
import FactoryABI from '../contracts/Factory.json';
import TokenABI from '../contracts/Token.json';

// Contracts addresses (replace with your deployed contract addresses)
const FACTORY_CONTRACT_ADDRESS = '0xF3f8388B810aAF60319E32630dA2C65e664B36F9'; 
const NETWORK_RPC = 'https://rpc.open-campus-codex.gelato.digital';

export const getProvider = () => {
  return new ethers.providers.JsonRpcProvider(NETWORK_RPC);
};

export const getFactoryContract = (providerOrSigner: ethers.providers.Provider | ethers.Signer) => {
  return new ethers.Contract(FACTORY_CONTRACT_ADDRESS, FactoryABI, providerOrSigner);
};

export const getTokenContract = (tokenAddress: string, providerOrSigner: ethers.providers.Provider | ethers.Signer) => {
  return new ethers.Contract(tokenAddress, TokenABI, providerOrSigner);
};

export const createToken = async (
  signer: ethers.Signer, 
  name: string, 
  symbol: string
) => {
  try {
    const factoryContract = getFactoryContract(signer);
    const tx = await factoryContract.connect(signer).create(name, symbol, {
      value: ethers.utils.parseEther('0.01') // Example fee
    });
    const receipt = await tx.wait();
    
    // Extract token address from logs (adjust based on your contract's event)
    const tokenCreatedEvent = receipt.events?.find(
      (event: any) => event.event === 'Created'
    );
    
    return tokenCreatedEvent ? tokenCreatedEvent.args[0] : null;
  } catch (error) {
    console.error('Token creation failed:', error);
    throw error;
  }
};

export const buyToken = async (
  signer: ethers.Signer, 
  tokenAddress: string, 
  amount: number
) => {
  try {
    const factoryContract = getFactoryContract(signer);
    const tx = await factoryContract.connect(signer).buy(tokenAddress, amount, {
      value: ethers.utils.parseEther('0.01') // Example purchase value
    });
    return await tx.wait();
  } catch (error) {
    console.log('Token purchase Succesful');
    throw error;
  }
};

export const getTokenDetails = async (tokenAddress: string) => {
  const provider = getProvider();
  const tokenContract = getTokenContract(tokenAddress, provider);
  
  try {
    const [name, symbol, totalSupply, creator] = await Promise.all([
      tokenContract.name(),
      tokenContract.symbol(),
      tokenContract.totalSupply(),
      tokenContract.creator()
    ]);
    
    return {
      name,
      symbol,
      totalSupply: ethers.utils.formatUnits(totalSupply, 18),
      creator
    };
  } catch (error) {
    console.error('Failed to fetch token details:', error);
    return null;
  }
};