import Web3Modal from 'web3modal';
import Web3 from 'web3';
import WalletConnectProvider from "@walletconnect/web3-provider";
import { providers, ethers } from 'ethers';
import { config } from "./config";
import { config1 } from "./config1";
import store from "../store";
import { setChainID, setWalletAddr, setBalance, setWeb3 } from '../store/actions';
import { parseErrorMsg } from '../components/utils';
const PresaleFactoryABI = config.PresaleFactoryAbi;
const PresaleFactoryAddress = config.PresaleFactoryAddress;
const PresaleNewABI = config.PresaleNewAbi;
const PresaleNewAddress = config.PresaleNewAddress;
const ProfitShareABI = config.ProfitShareAbi;
const ProfitShareAddress = config.ProfitShareAddress;
const AstroABI = config.AstroAbi;
const AstroAddress = config1.AstroAddress;
const AvaxAddress = config.AvaxAddress;
const USDCABI = config.USDCAbi;
const USDCAddress = config.USDCAddress;
const JOEABI = config.JoeRouterAbi;
const JOEAddress = config.JoeRouterAddress;
const AvaxAstroPairAddress = config.avaxAstroPair;
const AvaxAstroPairABI = config.avaxAstroAbi;
const MaxAmount = 10000000000000;
const MinAmount = 500;

let web3Modal;
if (typeof window !== "undefined") {
  web3Modal = new Web3Modal({
    network: "mainnet", // optional
    cacheProvider: true,
    providerOptions: {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId: config.INFURA_ID, // required
          rpc: {
            43114: config.testNetUrl,
          },
        },
      },
    }, // required
    theme: "dark",
  });
}

export let provider = null;
export let web3Provider = null;

export const loadWeb3 = async () => {
  try {
    // await web3Modal.updateTheme({
    //   background: "rgb(39, 49, 56)",
    //   main: "rgb(199, 199, 199)",
    //   secondary: "rgb(136, 136, 136)",
    //   border: "rgba(195, 195, 195, 0.14)",
    //   hover: "rgb(16, 26, 32)"
    // });
    // await web3Modal.clearCachedProvider();
    let web3 = new Web3(config.testNetUrl);
    store.dispatch(setWeb3(web3));

    provider = await web3Modal.connect();
    web3 = new Web3(provider);
    store.dispatch(setWeb3(web3));

    web3Provider = new providers.Web3Provider(provider);
    const network = await web3Provider.getNetwork();
    store.dispatch(setChainID(network.chainId));

    const signer = web3Provider.getSigner();
    const account = await signer.getAddress();
    store.dispatch(setWalletAddr(account));

    await getBalanceOfAccount();
    provider.on("accountsChanged", async function (accounts) {
      if (accounts[0] !== undefined) {
        store.dispatch(setWalletAddr(accounts[0]));
        await getBalanceOfAccount();
      } else {
        store.dispatch(setWalletAddr(''));
      }
    });

    provider.on('chainChanged', function (chainId) {
      store.dispatch(setChainID(chainId));
    });

    provider.on('disconnect', function (error) {
      store.dispatch(setWalletAddr(''));
    });
  } catch (error) {
    console.log('[Load Web3 error] = ', error);
  }
}

export const disconnect = async () => {
  await web3Modal.clearCachedProvider();
  const web3 = new Web3(config.testNetUrl);
  store.dispatch(setWeb3(web3));
  store.dispatch(setChainID(''));
  store.dispatch(setWalletAddr(''));
  store.dispatch(setBalance({
    usdtBalance: 0,
    avaxBalance: 0,
    // astroBalance: 0
  }));
}

export const checkNetwork = async () => {
  if (web3Provider) {
    const network = await web3Provider.getNetwork();
    store.dispatch(setChainID(network.chainId));
    return checkNetworkById(network.chainId);
  }
}

export const checkNetworkById = async (chainId) => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  if (web3.utils.toHex(chainId) !== web3.utils.toHex(config.chainId)) {
    await changeNetwork();
    return false;
  } else {
    return true;
  }
}

const changeNetwork = async () => {
  const web3 = store.getState().auth.web3;
  if (!web3) return;
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: web3.utils.toHex(config.chainId) }],
    });
    await getBalanceOfAccount();
  }
  catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: web3.utils.toHex(config.chainId),
              chainName: 'Avalanche',
              rpcUrls: [config.testNetUrl] /* ... */,
            },
          ],
        });
        return {
          success: true,
          message: "switching succeed"
        }
      } catch (addError) {
        return {
          success: false,
          message: "Switching failed." + addError.message
        }
      }
    }
  }
}

export const connectWallet = async () => {
  try {
    provider = await web3Modal.connect();
    const web3 = new Web3(provider);
    store.dispatch(setWeb3(web3));
    web3Provider = new providers.Web3Provider(provider);

    await checkNetwork();
    const signer = web3Provider.getSigner();
    const account = await signer.getAddress();

    if (account !== undefined) {
      store.dispatch(setWalletAddr(account));
    }

    await getBalanceOfAccount();
    return {
      success: true
    }
  } catch (err) {
    return {
      success: false,
      address: "",
      status: "Something went wrong: " + err.message,
    };
  }
};

export const getBalanceOfAccount = async () => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) return { success: false }
    let avaxBalance = await web3.eth.getBalance(accounts[0]);
    avaxBalance = web3.utils.fromWei(avaxBalance);
    avaxBalance = Number(Math.floor(avaxBalance * 10 ** 4) / 10 ** 4);
    
    const UsdcContract = new web3.eth.Contract(USDCABI, USDCAddress);
    let usdtBalance = await UsdcContract.methods.balanceOf(accounts[0]).call();
    usdtBalance = web3.utils.fromWei(usdtBalance);
    usdtBalance = Number(Math.floor(usdtBalance * 10 ** 12));

    // const AstroContract = new web3.eth.Contract(AstroABI, AstroAddress);
    // let astroBalance = await AstroContract.methods.balanceOf(accounts[0]).call();

    // astroBalance = web3.utils.fromWei(astroBalance);
    
    store.dispatch(setBalance({
      avaxBalance,
      usdtBalance,
      // astroBalance
    }));
    return {
      success: true,
      avaxBalance,
      usdtBalance,
      // astroBalance
    }
  } catch (error) {
    console.log('[Get Balance] = ', error);
    return {
      success: false,
      result: "Something went wrong: "
    }
  }
}

export const compareWalllet = (first, second) => {
  if (!first || !second) {
    return false;
  }
  if (first.toUpperCase() === second.toUpperCase()) {
    return true;
  }
  return false;
}

export const getTotalPresaleAmount_ = async () => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    // const AstroContract = new web3.eth.Contract(USDCABI, USDCAddress);
    // let presaleAmount = await AstroContract.methods.balanceOf(PresaleFactoryAddress).call();
    const PresaleContract = new web3.eth.Contract(PresaleFactoryABI, PresaleFactoryAddress);
    let totalDepositAmount = await PresaleContract.methods.totalDepositedBNBBalance().call();
    totalDepositAmount = web3.utils.fromWei(totalDepositAmount);
    return {
      success: true,
      totalDepositAmount
    }
  } catch (error) {
    console.log('[TOTAL Error] = ', error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}

export const getTotalMaticAmount = async () => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    // const AstroContract = new web3.eth.Contract(USDCABI, USDCAddress);
    // let presaleAmount = await AstroContract.methods.balanceOf(PresaleFactoryAddress).call();
    const PresaleContract = new web3.eth.Contract(PresaleFactoryABI, PresaleFactoryAddress);
    let totalMaticAmount = await PresaleContract.methods.getDepositAmount().call();
    totalMaticAmount = web3.utils.fromWei(totalMaticAmount);
    return {
      success: true,
      totalMaticAmount
    }
  } catch (error) {
    console.log('[TOTAL Error] = ', error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}

export const getMaxPresaleCap = async () => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const PresaleContract = new web3.eth.Contract(PresaleFactoryABI, PresaleFactoryAddress);
    let maxCap = await PresaleContract.methods.maxCapUSDC().call();
    maxCap = web3.utils.fromWei(maxCap, 'mwei');
    return {
      success: true,
      maxCap
    }
  } catch (error) {
    console.log('[MAX Error] = ', error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}

export const getMinPresaleCap = async () => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const PresaleContract = new web3.eth.Contract(PresaleFactoryABI, PresaleFactoryAddress);
    let minCap = await PresaleContract.methods.minCapUSDC().call();
    minCap = web3.utils.fromWei(minCap, 'mwei');
    return {
      success: true,
      minCap
    }
  } catch (error) {
    console.log('[MIN Error] = ', error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}

export const getStartPresaleTime_ = async () => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const PresaleContract = new web3.eth.Contract(PresaleFactoryABI, PresaleFactoryAddress);
    let start_time = await PresaleContract.methods.startTime().call();
    return {
      success: true,
      start_time
    }
  } catch (error) {
    console.log('[START Error] = ', error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}

export const getPresaleSuccess = async () => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const PresaleContract = new web3.eth.Contract(PresaleFactoryABI, PresaleFactoryAddress);
    let presaleSuccess = await PresaleContract.methods.presaleSuccess().call();
    return {
      success: true,
      presaleSuccess
    }
  } catch (error) {
    console.log('[getPresaleSuccess Error] = ', error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}

export const getEndPresaleTime_ = async () => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const PresaleContract = new web3.eth.Contract(PresaleFactoryABI, PresaleFactoryAddress);
    let end_time = await PresaleContract.methods.endTime().call();
    return {
      success: true,
      end_time
    }
  } catch (error) {
    console.log('[END Error] = ', error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}

export const getpTokenPriceForUSDC = async () => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const PresaleContract = new web3.eth.Contract(PresaleFactoryABI, PresaleFactoryAddress);
    let usdcPrice = await PresaleContract.methods.pTokenPrice_USDC().call();
    usdcPrice = web3.utils.fromWei(usdcPrice, 'mwei');
    return {
      success: true,
      usdcPrice
    }
  } catch (error) {
    console.log('[USDC Error] = ', error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}

export const getAVAXForUSDC = async (amountOut) => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const path = [];
    path.push(AvaxAddress);
    path.push(USDCAddress);
    const from_decimal = 'mwei';
    const to_decimal = 'ether';
    const JoeContract = new web3.eth.Contract(JOEABI, JOEAddress);
    let amountIn = await JoeContract.methods.getAmountsIn(web3.utils.toWei(amountOut.toString(), from_decimal), path).call();
    return {
      success: true,
      value: web3.utils.fromWei(amountIn[0], to_decimal)
    }
  } catch (error) {
    console.log('[AVAX For USDC Error] = ', error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}

export const getUSDCForAVAX = async (amountIn) => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const path = [];
    path.push(AvaxAddress);
    path.push(USDCAddress);
    const from_decimal = 'ether';
    const to_decimal = 'mwei';
    const JoeContract = new web3.eth.Contract(JOEABI, JOEAddress);
    let amountOut = await JoeContract.methods.getAmountsOut(web3.utils.toWei(amountIn.toString(), from_decimal), path).call();
    return {
      success: true,
      value: web3.utils.fromWei(amountOut[amountOut.length - 1], to_decimal)
    }
  } catch (error) {
    console.log('[USDC For AVAX Error] = ', error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}

export const getUserPaidUSDT = async () => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) return { success: false }
    const PresaleContract = new web3.eth.Contract(PresaleFactoryABI, PresaleFactoryAddress);
    let paidUSDT = await PresaleContract.methods.Total_USDT_Deposit_Amount().call();
    paidUSDT = web3.utils.fromWei(paidUSDT, 'lovelace');

    const PresaleContract1 = new web3.eth.Contract(PresaleNewABI, PresaleNewAddress);
    let paidETH = await PresaleContract1.methods.totalDepositedETHBalance().call();

    paidETH = Math.floor(paidETH / 10 ** 18 * 10 ** 4) / 10 ** 4;

    return {
      success: true,
      paidUSDT,
      paidETH
    }
  } catch (error) {
    console.log('[USDC Error] = ', error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}

export const getTokensRates = async () => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) return { success: false }

    const PresaleContract = new web3.eth.Contract(PresaleNewABI, PresaleNewAddress);
    let pTokensPerETH = await PresaleContract.methods.tokensPerETH().call();
    let pTokensPerUSDT = await PresaleContract.methods.tokensPerUSDT().call();

    pTokensPerETH = pTokensPerETH / 10;
    pTokensPerUSDT = Math.floor(pTokensPerUSDT / 10 ** 12 * 10) / 10;

    return {
      success: true,
      pTokensPerETH,
      pTokensPerUSDT
    }
  } catch (error) {
    console.log('[USDC Error] = ', error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}

export const buy_pToken_ = async (coinAmount, tokenAmount, coinType) => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) return { success: false }
    const PresaleContract = new web3.eth.Contract(PresaleFactoryABI, PresaleFactoryAddress);
    let decimal = 'ether';
    // if (coinType === 1) {
    //   decimal = 'mwei';
    //   nDecimal = 6;
    // }
    // coinAmount = Math.floor(coinAmount);
    
    // coinAmount = web3.utils.toWei(coinAmount.toString(), decimal);
    
    coinAmount = web3.utils.toWei(coinAmount.toString(), decimal);

    if (coinType === 0) {
    
      // await buyTokens.estimateGas({ from: accounts[0], value: coinAmount });
      await PresaleContract.methods.deposit().send({ from: accounts[0], value: coinAmount });

    }

    return {
      success: true
    }
  } catch (error) {
    console.log('[BUY Error] = ', error);
    return {
      success: false,
      error: parseErrorMsg(error.message)
    }
  }
}

export const claimGOT = async (coinAmount) => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) return { success: false }
    const PresaleContract = new web3.eth.Contract(PresaleFactoryABI, PresaleFactoryAddress);
    let decimal = 'ether', nDecimal = 18;
    coinAmount = Math.floor(coinAmount * 10 ** nDecimal) / 10 ** nDecimal;
    coinAmount = web3.utils.toWei(coinAmount.toString(), decimal);
    console.log("beast claim", coinAmount);
    const AstroContract = new web3.eth.Contract(AstroABI, AstroAddress);
    await AstroContract.methods.approve(PresaleFactoryAddress, coinAmount).send({ from: accounts[0] });
    const buyTokens = PresaleContract.methods.claim();
    await buyTokens.estimateGas({ from: accounts[0] });
    await PresaleContract.methods.claim().send({ from: accounts[0] });
    return {
      success: true
    }
  } catch (error) {
    console.log('[Claim Error] = ', error);
    return {
      success: false,
      error: parseErrorMsg(error.message)
    }
  }
}

export const refundUSDT = async (coinAmount) => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) return { success: false }
    const PresaleContract = new web3.eth.Contract(PresaleFactoryABI, PresaleFactoryAddress);
    let decimal = 'ether', nDecimal = 18;
    coinAmount = Math.floor(coinAmount * 10 ** nDecimal) / 10 ** nDecimal;
    coinAmount = web3.utils.toWei(coinAmount.toString(), decimal);
    const UsdcContract = new web3.eth.Contract(USDCABI, USDCAddress);
    await UsdcContract.methods.approve(PresaleFactoryAddress, coinAmount).send({ from: accounts[0] });
    const refundUSDT = PresaleContract.methods.refund();
    await refundUSDT.estimateGas({ from: accounts[0] });
    await PresaleContract.methods.refund().send({ from: accounts[0] });
    return {
      success: true
    }
  } catch (error) {
    console.log('[Claim Error] = ', error);
    return {
      success: false,
      error: parseErrorMsg(error.message)
    }
  }
}

export const setPresaleStartTime = async (_time) => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) return { success: false }
    const PresaleContract = new web3.eth.Contract(PresaleFactoryABI, PresaleFactoryAddress);
    const startTime = PresaleContract.methods.setStartTime(_time);
    await startTime.estimateGas({ from: accounts[0] });
    await PresaleContract.methods.setStartTime(_time).send({ from: accounts[0] });
    return {
      success: true
    }
  } catch (error) {
    return {
      success: false,
      error: parseErrorMsg(error.message)
    }
  }
}

export const setPresaleEndTime = async (_time) => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) return { success: false }
    const PresaleContract = new web3.eth.Contract(PresaleFactoryABI, PresaleFactoryAddress);
    const estimate = PresaleContract.methods.setEndTime(_time);
    await estimate.estimateGas({ from: accounts[0] });
    await PresaleContract.methods.setEndTime(_time).send({ from: accounts[0] });
    return {
      success: true
    }
  } catch (error) {
    return {
      success: false,
      error: parseErrorMsg(error.message)
    }
  }
}

export const setFeesOnNormalTransfer = async (enabled) => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) return { success: false }
    const AstroContract = new web3.eth.Contract(AstroABI, AstroAddress);
    const estimate = AstroContract.methods.setFeesOnNormalTransfers(enabled);
    await estimate.estimateGas({ from: accounts[0] });
    console.log(enabled)
    await AstroContract.methods.setFeesOnNormalTransfers(enabled).send({ from: accounts[0] });
    return {
      success: true
    }
  } catch (error) {
    return {
      success: false,
      error: parseErrorMsg(error.message)
    }
  }
}

export const setInitialDistributionFinished = async (enalbed) => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) return { success: false }
    const AstroContract = new web3.eth.Contract(AstroABI, AstroAddress);
    const estimate = AstroContract.methods.setInitialDistributionFinished(enalbed);
    await estimate.estimateGas({ from: accounts[0] });
    await AstroContract.methods.setInitialDistributionFinished(enalbed).send({ from: accounts[0] });
    return {
      success: true
    }
  } catch (error) {
    return {
      success: false,
      error: parseErrorMsg(error.message)
    }
  }
}

export const setMaxCap = async (_maxCap) => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) return { success: false }
    const PresaleContract = new web3.eth.Contract(PresaleFactoryABI, PresaleFactoryAddress);
    const maxCap = web3.utils.toWei(_maxCap.toString(), 'mwei');
    console.log('[Max Cap]', maxCap);
    const estimate = PresaleContract.methods.setMaxCapUSDC(maxCap);
    await estimate.estimateGas({ from: accounts[0] });
    await PresaleContract.methods.setMaxCapUSDC(maxCap).send({ from: accounts[0] });
    return {
      success: true
    }
  } catch (error) {
    return {
      success: false,
      error: parseErrorMsg(error.message)
    }
  }
}

export const setMinCap = async (_minCap) => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) return { success: false }
    const PresaleContract = new web3.eth.Contract(PresaleFactoryABI, PresaleFactoryAddress);
    const minCap = web3.utils.toWei(_minCap.toString(), 'mwei');
    console.log('[Min Cap]', minCap);
    const estimate = PresaleContract.methods.setMinCapUSDC(minCap);
    await estimate.estimateGas({ from: accounts[0] });
    await PresaleContract.methods.setMinCapUSDC(minCap).send({ from: accounts[0] });
    return {
      success: true
    }
  } catch (error) {
    return {
      success: false,
      error: parseErrorMsg(error.message)
    }
  }
}

export const setFeeReceivers = async (data) => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) return { success: false }
    const AstroContract = new web3.eth.Contract(AstroABI, AstroAddress);
    const estimate = AstroContract.methods.setFeeReceivers(data.liquidity_receiver, data.treasury_receiver, data.risk_free_value_receiver, data.operation_receiver, data.x_astro_receiver, data.future_ecosystem_receiver, data.burn_receiver);
    await estimate.estimateGas({ from: accounts[0] });
    await AstroContract.methods.setFeeReceivers(data.liquidity_receiver, data.treasury_receiver, data.risk_free_value_receiver, data.operation_receiver, data.x_astro_receiver, data.future_ecosystem_receiver, data.burn_receiver).send({ from: accounts[0] });
    return {
      success: true
    }
  } catch (error) {
    console.log(error)
    return {
      success: false,
      error: parseErrorMsg(error.message)
    }
  }
}


export const setFees = async (data) => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) return { success: false }
    const AstroContract = new web3.eth.Contract(AstroABI, AstroAddress);
    const estimate = AstroContract.methods.setFees(data.fee_kind, data.total, data.liquidity_fee, data.risk_free_value_fee, data.treasury_fee, data.fee_fee, data.operation_fee, data.x_astro_fee, data.burn_fee);
    await estimate.estimateGas({ from: accounts[0] });
    await AstroContract.methods.setFees(data.fee_kind, data.total, data.liquidity_fee, data.risk_free_value_fee, data.treasury_fee, data.fee_fee, data.operation_fee, data.x_astro_fee, data.burn_fee).send({ from: accounts[0] });
    return {
      success: true
    }
  } catch (error) {
    console.log(error)
    return {
      success: false,
      error: parseErrorMsg(error.message)
    }
  }
}

export const getAstroPriceInWeb3 = async () => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const PairContract = new web3.eth.Contract(AvaxAstroPairABI, AvaxAstroPairAddress);
    const result = await PairContract.methods.getReserves().call();
    const astroPrice = web3.utils.fromWei(result._reserve1, 'mwei') / web3.utils.fromWei(result._reserve0);
    return {
      success: true,
      astroPrice
    }
  } catch (error) {
    console.log('[USDC Error] = ', error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}

export const getRebaseFrequency = async () => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const AstroContract = new web3.eth.Contract(AstroABI, AstroAddress);
    let rebaseFrequency = await AstroContract.methods.rebaseFrequency().call();
    return {
      success: true,
      rebaseFrequency
    }
  } catch (error) {
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}

export const getNextRebase = async () => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const AstroContract = new web3.eth.Contract(AstroABI, AstroAddress);
    let nextRebase = await AstroContract.methods.nextRebase().call();
    return {
      success: true,
      nextRebase
    }
  } catch (error) {
    console.log('[Next] = ', error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}

export const getMarketCap = async (astroPrice) => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const AstroContract = new web3.eth.Contract(AstroABI, AstroAddress);
    let supply = await AstroContract.methods.getCirculatingSupply().call();
    supply = web3.utils.fromWei(supply);
    const marketCap = supply * astroPrice;
    return {
      success: true,
      marketCap
    }
  } catch (error) {
    console.log('[MarketCap] = ', error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}

export const getStartClaimTime = async () => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const ProfitShareContract = new web3.eth.Contract(ProfitShareABI, ProfitShareAddress);
    let start_time = await ProfitShareContract.methods.start_claim_time().call();
    return {
      success: true,
      start_time
    }
  } catch (error) {
    console.log('[START Error] = ', error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}

export const getEndClaimTime = async () => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const ProfitShareContract = new web3.eth.Contract(ProfitShareABI, ProfitShareAddress);
    let end_time = await ProfitShareContract.methods.end_claim_time().call();
    return {
      success: true,
      end_time
    }
  } catch (error) {
    console.log('[END Error] = ', error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}

export const getStakedAmount = async () => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) return { success: false }
    const ProfitShareContract = new web3.eth.Contract(ProfitShareABI, ProfitShareAddress);
    let staked_Amount = await ProfitShareContract.methods._userStakedGOT(accounts[0]).call();
    return {
      success: true,
      staked_Amount
    }
  } catch (error) {
    console.log('[STAKED AMOUNT Error] = ', error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}

export const getRewardAmount = async () => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) return { success: false }
    const ProfitShareContract = new web3.eth.Contract(ProfitShareABI, ProfitShareAddress);
    let reward_amount = await ProfitShareContract.methods.getRewardAmount().call({from: accounts[0]});
    return {
      success: true,
      reward_amount
    }
  } catch (error) {
    console.log('[REWARD AMOUNT Error] = ', error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}

export const stake = async (coinAmount) => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) return { success: false }
    const ProfitShareContract = new web3.eth.Contract(ProfitShareABI, ProfitShareAddress);
    let decimal = 'ether', nDecimal = 18;
    coinAmount = Math.floor(coinAmount * 10 ** nDecimal) / 10 ** nDecimal;
    coinAmount = web3.utils.toWei(coinAmount.toString(), decimal);
    console.log("beast claim", coinAmount);
    const AstroContract = new web3.eth.Contract(AstroABI, AstroAddress);
    await AstroContract.methods.approve(ProfitShareAddress, coinAmount).send({ from: accounts[0] });
    const buyTokens = ProfitShareContract.methods.stake(coinAmount);
    await buyTokens.estimateGas({ from: accounts[0] });
    await ProfitShareContract.methods.stake(coinAmount).send({ from: accounts[0] });
    return {
      success: true
    }
  } catch (error) {
    console.log('[Stake Error] = ', error);
    return {
      success: false,
      error: parseErrorMsg(error.message)
    }
  }
}

export const unstake = async (coinAmount) => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) return { success: false }
    const ProfitShareContract = new web3.eth.Contract(ProfitShareABI, ProfitShareAddress);
    let decimal = 'ether', nDecimal = 18;
    coinAmount = Math.floor(coinAmount * 10 ** nDecimal) / 10 ** nDecimal;
    coinAmount = web3.utils.toWei(coinAmount.toString(), decimal);
    console.log("beast claim", coinAmount);
    const AstroContract = new web3.eth.Contract(AstroABI, AstroAddress);
    await AstroContract.methods.approve(ProfitShareAddress, coinAmount).send({ from: accounts[0] });
    const buyTokens = ProfitShareContract.methods.unstake(coinAmount);
    await buyTokens.estimateGas({ from: accounts[0] });
    await ProfitShareContract.methods.unstake(coinAmount).send({ from: accounts[0] });
    return {
      success: true
    }
  } catch (error) {
    console.log('[Stake Error] = ', error);
    return {
      success: false,
      error: parseErrorMsg(error.message)
    }
  }
}

export const claimUSDT = async (coinAmount) => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) return { success: false }
    const ProfitShareContract = new web3.eth.Contract(ProfitShareABI, ProfitShareAddress);
    let decimal = 'ether', nDecimal = 18;
    coinAmount = Math.floor(coinAmount * 10 ** nDecimal) / 10 ** nDecimal;
    coinAmount = web3.utils.toWei(coinAmount.toString(), decimal);
    console.log("beast claim", coinAmount);
    // const AstroContract = new web3.eth.Contract(AstroABI, AstroAddress);
    // await AstroContract.methods.approve(PresaleFactoryAddress, coinAmount).send({ from: accounts[0] });
    const UsdcContract = new web3.eth.Contract(USDCABI, USDCAddress);
    await UsdcContract.methods.approve(ProfitShareAddress, coinAmount).send({ from: accounts[0] });
    const buyTokens = ProfitShareContract.methods.claim();
    await buyTokens.estimateGas({ from: accounts[0] });
    await ProfitShareContract.methods.claim().send({ from: accounts[0] });
    return {
      success: true
    }
  } catch (error) {
    console.log('[Claim Error] = ', error);
    return {
      success: false,
      error: parseErrorMsg(error.message)
    }
  }
}

export const getClaimableBalance = async () => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) return { success: false }
    const PresaleContract = new web3.eth.Contract(PresaleNewABI, PresaleNewAddress);
    let Balance1 = await PresaleContract.methods.claimableTokensByEth(accounts[0]).call();
    let Balance2 = await PresaleContract.methods.claimableTokensByUsdt(accounts[0]).call();
    let claimable = Math.floor(((Number(Balance1) + Number(Balance2)) / 10 ** 18) * 10) / 10;

    return {
      success: true,
      claimable
    }
  } catch (error) {
    console.log('[USDC Error] = ', error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}

export const getTotalPresaleAmount = async () => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    // const AstroContract = new web3.eth.Contract(USDCABI, USDCAddress);
    // let presaleAmount = await AstroContract.methods.balanceOf(PresaleFactoryAddress).call();
    const PresaleContract = new web3.eth.Contract(PresaleNewABI, PresaleNewAddress);
    let totalDepositAmount = await PresaleContract.methods.weiRaised().call();
    totalDepositAmount = web3.utils.fromWei(totalDepositAmount);
    return {
      success: true,
      totalDepositAmount
    }
  } catch (error) {
    console.log('[TOTAL Error] = ', error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}

export const getStartPresaleTime = async () => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const PresaleContract = new web3.eth.Contract(PresaleNewABI, PresaleNewAddress);
    let start_time = await PresaleContract.methods.startTime().call();
    return {
      success: true,
      start_time
    }
  } catch (error) {
    console.log('[START Error] = ', error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}

export const getEndPresaleTime = async () => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const PresaleContract = new web3.eth.Contract(PresaleNewABI, PresaleNewAddress);
    let end_time = await PresaleContract.methods.endTime().call();
    return {
      success: true,
      end_time
    }
  } catch (error) {
    console.log('[END Error] = ', error);
    return {
      success: false,
      result: "Something went wrong "
    }
  }
}

export const claim_pToken = async () => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }

  try {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) return { success: false }
    const PresaleContract = new web3.eth.Contract(PresaleNewABI, PresaleNewAddress);
    await PresaleContract.methods.claimTokens().send({ from: accounts[0] });

    return {
      success: true
    }
  } catch (error) {
      console.log('[BUY Error] = ', error);
    return {
      success: false,
      error: parseErrorMsg(error.message)
    }
  }
}

export const buy_pToken = async (type, ref, coinAmount) => {
  const web3 = store.getState().auth.web3;
  if (!web3) return { success: false }
  try {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) return { success: false }
    const PresaleContract = new web3.eth.Contract(PresaleNewABI, PresaleNewAddress);
    let decimal = 'ether';

   

    if (type == 0 && ref == null) {
      const UsdcContract = new web3.eth.Contract(USDCABI, USDCAddress);
      const _allowance = await UsdcContract.methods.allowance(accounts[0], PresaleFactoryAddress).call()
      
      if(Number(ethers.utils.formatUnits(_allowance, 6)) === 0) {
          await UsdcContract.methods.approve(PresaleFactoryAddress, MaxAmount).send({ from: accounts[0]});  
      }

      coinAmount = Number(Math.floor(coinAmount * 10 ** 6) / 10 ** 6).toFixed(0);
      coinAmount = web3.utils.toWei(coinAmount.toString(), 'wei');

      
      
      await PresaleContract.methods.buyTokensByUSDTwithoutReferral(accounts[0],coinAmount).send({ from: accounts[0]});
    }  
    if (type== 1 && ref == null) {

      coinAmount = Math.floor(coinAmount * 10 ** 18) / 10 ** 18;
      coinAmount = web3.utils.toWei(coinAmount.toString(), decimal);

      await PresaleContract.methods.buyTokensWithoutReferral().send({ from: accounts[0], value:coinAmount });
    }

    if (type == 0 && ref != null) {
      const UsdcContract = new web3.eth.Contract(USDCABI, USDCAddress);

      const _allowance = await UsdcContract.methods.allowance(accounts[0], PresaleFactoryAddress).call()
      
      if(Number(ethers.utils.formatUnits(_allowance, 6)) === 0) {
        await UsdcContract.methods.approve(PresaleFactoryAddress, MaxAmount).send({ from: accounts[0]});  
      }

      coinAmount = Number(Math.floor(coinAmount * 10 ** 6) / 10 ** 6).toFixed(0);
      coinAmount = web3.utils.toWei(coinAmount.toString(), "wei");

      await PresaleContract.methods.buyTokensByUSDTwithReferral(accounts[0], ref, coinAmount).send({ from: accounts[0]})
      
    }
    if (type== 1 && ref != null) {
      
      coinAmount = Math.floor(coinAmount * 10 ** 18) / 10 ** 18;
      coinAmount = web3.utils.toWei(coinAmount.toString(), decimal);
      await PresaleContract.methods.buyTokensWithReferral(ref).send({ from: accounts[0], value:coinAmount});
    }

    return {
      success: true
    }
  } catch (error) {
      console.log('[BUY Error] = ', error);
    return {
      success: false,
      error: parseErrorMsg(error.message)
    }
  }
}