// khai báo thư viện react
import React, { useEffect, useState } from "react";
// khai báo ethers
import { ethers } from "ethers";
import Web3 from 'web3';
import { Alchemy, Network } from "alchemy-sdk";

//khai báo abi
import { contractABI, contractAddress } from "../utils/constants";

export const TransactionContext = React.createContext();

const { ethereum } = window;
//api và thư viện của al
const config = {
  apiKey: "ZshCE5mAKP3KsR3oJ9A269SycASWndiQ",
  network: Network.ETH_GOERLI,
};
const alchemy = new Alchemy(config);


const createEthereumContract = () => {
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  const transactionsContract = new ethers.Contract(contractAddress, contractABI, signer);

  return transactionsContract;
};

export const TransactionsProvider = ({ children }) => {
  const [formData, setformData] = useState({ addressTo: "", amount: "", keyword: "", message: "" });
  const [currentAccount, setCurrentAccount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transactionCount, setTransactionCount] = useState(localStorage.getItem("transactionCount"));
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState("");
  const [nfts, setNfts] = useState([]);
  const [tokens, setTokens] = useState([]);

  const handleChange = (e, name) => {
    setformData((prevState) => ({ ...prevState, [name]: e.target.value }));
  };


  const getAllTransactions = async () => {
    try {
      if (ethereum) {
        const transactionsContract = createEthereumContract();

        const availableTransactions = await transactionsContract.getAllTransactions();

        const structuredTransactions = availableTransactions.map((transaction) => ({
          addressTo: transaction.receiver,
          addressFrom: transaction.sender,
          timestamp: new Date(transaction.timestamp.toNumber() * 1000).toLocaleString(),
          message: transaction.message,
          keyword: transaction.keyword,
          amount: parseInt(transaction.amount._hex) / (10 ** 18)
        }));

        //console.log(structuredTransactions);

        setTransactions(structuredTransactions);
      } else {
        console.log("Ethereum is not present");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnect = async () => {
    try {
      if (!ethereum) return alert("Please install MetaMask.");

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length) {
        setCurrentAccount(accounts[0]);

        getAllTransactions();
      } else {
        console.log("No accounts found");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfTransactionsExists = async () => {
    try {
      if (ethereum) {
        const transactionsContract = createEthereumContract();
        const currentTransactionCount = await transactionsContract.getTransactionCount();

        window.localStorage.setItem("transactionCount", currentTransactionCount);
      }
    } catch (error) {
      console.log(error);

      throw new Error("No ethereum object");
    }
  };

  const connectWallet = async () => {
    try {
      if (!ethereum) return alert("Please install MetaMask.");

      const accounts = await ethereum.request({ method: "eth_requestAccounts", });

      setCurrentAccount(accounts[0]);
      window.location.reload();
    } catch (error) {
      console.log(error);

      throw new Error("No ethereum object");
    }
  };


  const getBalanceFromMetaMask = async () => {
    if (typeof window.ethereum === 'undefined') {
      console.log('Vui lòng cài đặt MetaMask để sử dụng tính năng này.');
      return;
    }

    const web3 = new Web3(window.ethereum);

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = await web3.eth.getAccounts();
      const address = accounts[0];
      const balanceWei = await web3.eth.getBalance(address);
      const balanceEther = web3.utils.fromWei(balanceWei, 'ether');

      setCurrentAccount(address);
      setBalance(balanceEther);
    } catch (error) {
      console.error('Lỗi khi lấy số dư từ MetaMask:', error);
    }
  };


  const fetchNFTs = async () => {

    if (typeof window.ethereum === 'undefined') {
      console.log('Vui lòng cài đặt MetaMask để sử dụng tính năng này.');
      return;

    }
    const web3 = new Web3(window.ethereum);
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = await web3.eth.getAccounts();
      const address = accounts[0];
      // Lấy danh sách NFTs từ API của Alchemy
      const nftsData = await alchemy.nft.getNftsForOwner(address);
     // console.log("địa chỉ nè "+ address);
      // Chuyển đổi nftsData về dạng mảng nếu nó không phải là mảng
      const nftsArray = Array.isArray(nftsData) ? nftsData : [nftsData];
      // Gán giá trị cho nfts
      setNfts(nftsArray);
    } catch (error) {
      console.log(error);
    }
  };

  //
  const showTokens = async () =>{

    if (typeof window.ethereum === 'undefined') {
      console.log('Vui lòng cài đặt MetaMask để sử dụng tính năng này.');
      return;

    }
    const web3 = new Web3(window.ethereum);
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = await web3.eth.getAccounts();
      const address = accounts[0];
      // Lấy danh sách NFTs từ API của Alchemy
      const nftsData = await alchemy.core.getTokenBalances(address);
     // console.log("địa chỉ nè "+ address);
      // Chuyển đổi nftsData về dạng mảng nếu nó không phải là mảng
      const nftsArray = Array.isArray(nftsData) ? nftsData : [nftsData];
      // Gán giá trị cho nfts
      setTokens(nftsArray);
    } catch (error) {
      console.log(error);
    }
  };

  const sendTransaction = async () => {
    try {
      if (ethereum) {
        const { addressTo, amount, keyword, message } = formData;
        const transactionsContract = createEthereumContract();
        const parsedAmount = ethers.utils.parseEther(amount);

        await ethereum.request({
          method: "eth_sendTransaction",
          params: [{
            from: currentAccount,
            to: addressTo,
            gas: "0x5208",
            value: parsedAmount._hex,
          }],
        });

        const transactionHash = await transactionsContract.addToBlockchain(addressTo, parsedAmount, message, keyword);

        setIsLoading(true);
        console.log(`Loading - ${transactionHash.hash}`);
        await transactionHash.wait();
        console.log(`Success - ${transactionHash.hash}`);
        setIsLoading(false);

        const transactionsCount = await transactionsContract.getTransactionCount();

        setTransactionCount(transactionsCount.toNumber());
        window.location.reload();
      } else {
        console.log("No ethereum object");
      }
    } catch (error) {
      console.log(error);

      throw new Error("No ethereum object");
    }
  };

  useEffect(() => {
    checkIfWalletIsConnect();
    checkIfTransactionsExists();
    getBalanceFromMetaMask();
    fetchNFTs();
    showTokens();
  }, [transactionCount, nfts, tokens]);

  return (
    <TransactionContext.Provider
      value={{
        transactionCount,
        connectWallet,
        transactions,
        currentAccount,
        isLoading,
        sendTransaction,
        handleChange,
        formData,
        balance,
        nfts,
        tokens,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
