/* eslint-disable jsx-a11y/anchor-is-valid */
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Reveal } from 'react-awesome-reveal';
import { createGlobalStyle } from 'styled-components';
import Slider from '@mui/material/Slider';
import Modal from '@mui/material/Modal';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { toast } from 'react-toastify';
import ReactToolTip from 'react-tooltip';
import * as selectors from '../store/selectors';
import SelectCoin from '../components/swap/SelectSwapCoin';
import { fadeInUp, numberWithCommas } from '../components/utils';
import { getAmountsOut, swap, getAstroAllowance, getUSDCAllowance, approveAstro, approveUSDC, getAmountsIn, getReservesForPair } from '../core/SwapFactory';
import { getAstroPrice } from '../core/axios';
import { config, def_config } from '../core/config';
// import IFrame from '../components/swap/IFrame';

const GlobalStyles = createGlobalStyle`
  .swap-container {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-direction: column;
    background-size: cover !important;
    background-position-x: center !important;
    padding: 20px;
    @media only screen and (max-width: 1200px) {
      .col {
        width: 100%;
      }
    }
  }

  .swap-title {
    width: fit-content;
    text-overflow: ellipsis;
    white-space: nowrap;
    h3 {
      line-height: 2rem;
    }
  }

  .exchange-card {
    height: fit-content;
    background-color: #14162e;
    border-radius: 20px;
    padding: 30px;
  }
  .card-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .input-token-panel {
    display: flex;
    background-color: #151b344d;
    border: solid 1px #5947FF;
    border-radius: 20px;
    flex-direction: column;
    text-align: left;
    padding: 20px 16px 10px;
    gap: 10px;
  }

  .input-token {
    width: 60%;
    background: transparent;
    outline: none;
    font-family: 'CenturyGothicB';
    font-size: 22px;
    color: #ffb84d;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .slippage-form {
    width: 60%;
    border: solid 1px white;
    border-radius: 10px;
    .input-slippage {
      width: 100%;
      background: transparent;
      outline: none;
      padding: 5px 10px;
      font-family: 'Poppins';
      font-size: 16px;
      font-weight: 400;
      color: white;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }  

  .btn-change {
    background-color: #ffb84d !important;
    border-radius: 50% !important;
    &:hover {
      background: #e9c083 !important;
    }
  }

  .btn-swap {
    width: 100%;
    padding: 10px;
    font-family: 'Poppins';
    font-size: 18px;
    border-radius: 8px;
    background: linear-gradient(90deg, #7A1BFF -3.88%, #5947FF 100%);
    &.approve {
      background: #4ed047;
    }
    :disabled {
      background: #626262b3;
    }
  }

  .btn-max {
    padding: 0px 5px;
    margin: 10px 10px 10px 0px;
    &:hover {
      background: #4c3486;
      border-radius: 8px;
    }
  }

  .btn-select-coin {
    padding: 0px 15px;
    margin: 10px 0px;
    &:hover {
      background: #4c3486;
      border-radius: 8px;
    }
  }

  .swap-color {
    color: #ffb84d;
  }

  .MuiChip-label {
    padding-left: 8px;
    padding-right: 8px;
    font-size: 18px;
  }

  .calc-label {
    font-family: "Poppins";
    font-size: 16px;
    font-weight: 400;
    color: #BCC3CF;
  }

  .full-card {
    width: 90%;
    @media only screen and (max-width: 1200px) {
      width: 100%;
    }
  }
`;

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: '#271c63',
  borderRadius: '20px',
  boxShadow: 24,
  pt: 4,
  pb: 4,
  px: 3,
};

const astro_coin = [
  { code: 1, label: 'AVAX' },
];

const coinLabel = (arrange, coinType) => {
  if (arrange && coinType === 0) {
    return 'AVAX';
  } else if (arrange && coinType === 1) {
    return 'USDC';
  } else {
    return 'ASTRO';
  }  
}

const Swap = (props) => {
  const DEF_APY = 100003.37;
  const SWAP_FEE = def_config.SWAP_FEE;
  const AUTO_SLIPPAGE = def_config.AUTO_SLIPPAGE;
  const balance = useSelector(selectors.userBalance);
  const wallet = useSelector(selectors.userWallet);
  const web3 = useSelector(selectors.web3State);
  const [tokenPrice, setTokenPrice] = useState(0);
  const [coinType, setCoinType] = useState(0);
  const [amount, setAmount] = useState(0);
  const [apy, setAPY] = useState(DEF_APY);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [futurePrice, setFuturePrice] = useState(0);
  const [days, setDays] = useState(30);
  const [initAmount, setInitAmount] = useState(0);
  const [wealth, setWealth] = useState(0);
  const [rewardEst, setRewardEst] = useState(0);
  const [potentialReturn, setPotentialReturn] = useState(0);
  const [fromBalance, setFromBalance] = useState(0);
  const [toBalance, setToBalance] = useState(0);
  const [insufficient, setInsufficient] = useState(false);
  const [isApprovedUSDC, setApproveUSDC] = useState(false);
  const [isApprovedASTRO, setApproveASTRO] = useState(false);
  const [providerFee, setProviderFee] = useState(0);
  const [amountPerAstro, setAmountPerAstro] = useState(0);
  const [slippage, setSlippage] = useState(AUTO_SLIPPAGE);
  const [reserves, setReserves] = useState([]); // 0: ASTRO 1: USDC
  const [priceImpact, setPriceImpact] = useState(0);
  const [amountMinMax, setAmountMinMax] = useState(0);

  const [coin_arrange, setCoinArrange] = useState(true); // true: From, false: To
  const [exactToken, setExactToken] = useState(true); // true: From, false: To
  const [tokenAmountA, setTokenAmountA] = useState('');
  const [tokenAmountB, setTokenAmountB] = useState('');

  const [tradingTax, setTradingTax] = useState(0);

  const [openModal, setOpenModal] = useState(false);
  const handleOpen = () => setOpenModal(true);
  const handleClose = () => setOpenModal(false);

  const handleSlide = useCallback((event, value) => {
    setDays(value);
  }, []);

  const handleSelectCoin = useCallback((value) => {
    setCoinType(value);
  }, []);

  const handleAmount = useCallback((event) => {
    setAmount(event.target.value);
  }, []);

  const handleAPY = useCallback((event) => {
    setAPY(event.target.value);
  }, []);

  const handlePurchasePrice = useCallback((event) => {
    setPurchasePrice(event.target.value);
  }, []);

  const handleFuturePrice = useCallback((event) => {
    setFuturePrice(event.target.value);
  }, []);

  const handleMax = useCallback(() => {
    if (balance.astroBalance !== '')
      setAmount(Number(balance.astroBalance));
    else {
      setAmount(0);
    }
  }, [balance]);

  const handleFromPercent = async (value) => {
    let balanceAmount = 0;
    if (balance.astroBalance !== '') {
      if (coin_arrange) {
        if (coinType === 0) {
        //   setTokenAmountA(Number(balance.avaxBalance) * value / 100);
        //   balanceAmount = Number(balance.avaxBalance) * value / 100;
        // } else {
          setTokenAmountA(Number(balance.usdcBalance) * value / 100);
          balanceAmount = Number(balance.usdcBalance) * value / 100;
        }
      } else {
        setTokenAmountA(Number(balance.astroBalance) * value / 100);
        balanceAmount = Number(balance.astroBalance) * value / 100;
      }
    }
    if (balanceAmount <= 0) {
      setTokenAmountA(0);
      setTokenAmountB('');
    } else {
      handleChangeTokenAmount(balanceAmount, 'out');
    }
  }

  const handleSwapMax = (type) => {
    let balanceAmount = 0;
    if (balance.astroBalance === '') return;

    if (type === 1) {
      if (coin_arrange) {
        if (coinType === 0) {
        //   setTokenAmountA(Number(balance.avaxBalance));
        //   balanceAmount = Number(balance.avaxBalance);
        // } else {
          setTokenAmountA(Number(balance.usdcBalance));
          balanceAmount = Number(balance.usdcBalance);
        }
      } else {
        setTokenAmountA(Number(balance.astroBalance));
        balanceAmount = Number(balance.astroBalance);
      }

      if (balanceAmount <= 0) {
        setTokenAmountA(0);
        setTokenAmountB('');
      } else {
        handleChangeTokenAmount(balanceAmount, 'out');
      }
    } else {
      if (coin_arrange) {
        setTokenAmountB(Number(balance.astroBalance));
        balanceAmount = Number(balance.astroBalance);
      } else {
        if (coinType === 0) {
        //   setTokenAmountB(Number(balance.avaxBalance));
        //   balanceAmount = Number(balance.avaxBalance);
        // } else {
          setTokenAmountB(Number(balance.usdcBalance));
          balanceAmount = Number(balance.usdcBalance);
        }
      }

      if (balanceAmount <= 0) {
        setTokenAmountB(0);
        setTokenAmountA('');
      } else {
        handleChangeTokenAmount(balanceAmount, 'in');
      }
    }
  }

  const handleSlippage = (value) => {
    setSlippage(value);
    if (exactToken) {
      setAmountMinMax(tokenAmountB * (1 - value / 100));
    } else {
      setAmountMinMax(tokenAmountA * (1 + value / 100));
    }
  }

  const onClick_ApproveASTRO = async () => {
    await approveAstro();
  }

  const onClick_ApproveUSDC = async () => {
    await approveUSDC();
  }

  const onClick_ChangeCoin = async () => {
    const arrange = !coin_arrange;
    setCoinArrange(arrange);
    if (exactToken) {
      setTokenAmountB(tokenAmountA);
      handleChangeTokenAmount(tokenAmountA, 'in', arrange);
    } else {
      setTokenAmountA(tokenAmountB);
      handleChangeTokenAmount(tokenAmountB, 'out', arrange);
    }
    setExactToken(!exactToken);
  }

  const onChangeTokenAmountA = async (event) => {
    setTokenAmountA(event.target.value);
    handleChangeTokenAmount(Number(event.target.value), 'out');
    setExactToken(true);
  }
  const onChangeTokenAmountB = async (event) => {
    setTokenAmountB(event.target.value);
    handleChangeTokenAmount(Number(event.target.value), 'in');
    setExactToken(false);
  }

  const handleChangeTokenAmount = async (amount, type, arrange = coin_arrange) => {
    if (type === 'out') {
      if (Number(amount) === 0) {
        setTokenAmountB('');
      } else {
        let ret_val = await getAmountsOut(amount, arrange, coinType);
        if (ret_val.success === true) {
          setTokenAmountB(ret_val.amountOut);
          setAmountMinMax(ret_val.amountOut * (1 - slippage / 100));
          let amountOut = ret_val.amountOut;
          if (!arrange)
            amountOut = amount;
          priceImpactCalculation(reserves[0], amountOut);  // If destination(To amount) is ASTRO, the impact has been calculated with only ASTRO.
        } else {
          setTokenAmountB('');
        }
      }
    } else if (type === 'in') {
      if (Number(amount) === 0) {
        setTokenAmountA('');
      } else {
        let ret_val = await getAmountsIn(amount, arrange, coinType);
        if (ret_val.success === true) {
          setTokenAmountA(ret_val.amountIn);
          setAmountMinMax(ret_val.amountIn * (1 + slippage / 100));
          const reserve = receiveCoinType === 'ASTRO' ? reserves[0] : reserves[1];
          priceImpactCalculation(reserve, ret_val.amountIn);
          let amountOut = amount;
          if (!arrange)
            amountOut = ret_val.amountIn;
          priceImpactCalculation(reserves[0], amountOut);  // If destination(To amount) is ASTRO, the impact has been calculated with only ASTRO.
        } else {
          setTokenAmountA('');
        }
      }
    }
  }

  const priceImpactCalculation = (reserve, amountTraded) => { // reserve should be ASTRO.
    const fee = 0.003;
    const amountInWithFee = Number(amountTraded * (1 - fee))
    const reserveTokenFrom = Number(reserve)
    const priceImpact = amountInWithFee / (reserveTokenFrom + amountInWithFee)
    const priceImpactPersent = (priceImpact * 100).toFixed(2);
    setPriceImpact(priceImpactPersent)
  }

  const receiveCoinType = useMemo(() => {
    let type = 0;
    if (exactToken) {
      if (coin_arrange) {
        type = 'ASTRO';
      } else {
        type = coinType === 0 ? 'AVAX' : 'USDC';
      }
    } else {
      if (coin_arrange) {
        type = coinType === 0 ? 'AVAX' : 'USDC';
      } else {
        type = 'ASTRO';
      }
    }
    return type;
  }, [coinType, coin_arrange, exactToken]);

  const addTokenCallback = useCallback(async () => {
    const tokenAddress = config.AstroAddress;
    const tokenSymbol = 'ASTRO';
    const tokenDecimals = 18;
    const tokenImage = `https://raw.githubusercontent.com/traderjoe-xyz/joe-tokenlists/main/logos/${config.AstroAddress}/logo.png`;

    try {
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: tokenDecimals,
            image: tokenImage,
          },
        },
      });

      if (wasAdded) {
        console.log('Adding ASTRO token');
      } else {
        console.log('ASTRO token has been added to you wallet!')
      }
    } catch (error) {
      console.log(error);
    }
  }, [])

  const handleSwap = async () => {
    const result = await swap(Number(tokenAmountA), Number(tokenAmountB), exactToken, amountMinMax, coin_arrange, coinType);
    if (result.success) {
      toast.success('Completed successfully!');
    } else {
      toast.error('The transaction has been failed: ' + result.error);
    }
  }

  const initialize = useCallback(async () => {
    console.log('[Wallet] = ', wallet);
    if (!web3) {
      return;
    }
    let result = await getAstroAllowance();
    if (result) {
      setApproveASTRO(true);
    }
    result = await getUSDCAllowance();
    if (result) {
      setApproveUSDC(true);
    }
    result = await getReservesForPair();
    if (result.success) {
      setReserves(result.reserves);
    }
  }, [web3, wallet]);

  useEffect(() => {
    const getTokenPrice = async () => {
      const result = await getAstroPrice();
      if (result.success) {
        setTokenPrice(result.astroPrice);
      }
    }
    getTokenPrice();
  }, []);

  useEffect(() => {
    let price = 0;
    let tax = 0;
    if (coin_arrange && Number(tokenAmountB) > 0) {
      price = Number(tokenAmountA) / Number(tokenAmountB);
      tax = Number(tokenAmountB) * def_config.BUY_FEE;
    } else if (!coin_arrange && Number(tokenAmountA) > 0) {
      price = Number(tokenAmountB) / Number(tokenAmountA);
      tax = Number(tokenAmountA) * def_config.SELL_FEE;
    }
    
    setTradingTax(tax);
    setAmountPerAstro(numberWithCommas(price, 10));
    setProviderFee(Number(tokenAmountA) * SWAP_FEE);
  }, [tokenAmountA, tokenAmountB, coin_arrange, SWAP_FEE]);

  useEffect(() => {
    if (Number(tokenAmountA) > fromBalance) {
      setInsufficient(true);
    } else {
      setInsufficient(false);
    }
  }, [tokenAmountA, fromBalance]);

  useEffect(() => {
    if (coin_arrange) {
      if (coinType === 0) {
        setFromBalance(Number(balance.avaxBalance));
      } else if (coinType === 1) {
        setFromBalance(Number(balance.usdcBalance));
      }
      setToBalance(Number(balance.astroBalance));
    } else {
      if (coinType === 0) {
        setToBalance(Number(balance.avaxBalance));
      } else if (coinType === 1) {
        setToBalance(Number(balance.usdcBalance));
      }
      setFromBalance(Number(balance.astroBalance));
    }
  }, [balance, coin_arrange, coinType]);

  useEffect(() => {
    setInitAmount((Number(amount) * Number(purchasePrice)));
    setWealth((Number(amount) * Number(tokenPrice)));
    const rewards = ((((Number(apy) + 100) / 100) ** (days / 365)) * Number(amount));
    setRewardEst(rewards);
    setPotentialReturn((rewards * Number(futurePrice)));
  }, [amount, apy, purchasePrice, futurePrice, days, tokenPrice]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className='page-container swap-container'>
      <GlobalStyles />
      <div className='flex flex-column full-width'>
        <div className='row row-gap-2'>
          <div className='col-xl-7 col-lg-12 align-items-stretch pb-3'>
            <Reveal keyframes={fadeInUp} className='onStep' delay={0} duration={800} triggerOnce>
              <div className='swap-title'>
                <span className='fs-18 f-century fw-bold ls-1 mb-2 ms-4'>WHAT TO DO</span>
              </div>
            </Reveal>
            <Reveal className='full-card full-height onStep' keyframes={fadeInUp} delay={400} duration={800} triggerOnce>
              <div className='row text-left justify-between full-height'>
                <div className='col-md-12'>
                  <div className='main-card'>
                    <p className='f-semi-b'>Steps to Financial Freedom with ASTRO</p>
                    <div className='flex align-items-center gap-2'>
                      <p className='f-century-b fs-22 mb-0' style={{ whiteSpace: 'nowrap' }}>Step 1:</p>
                      <p className='fs-18 mb-0'>Buy ASTRO</p>
                    </div>
                    <div className='flex align-items-center gap-2'>
                      <p className='f-century-b fs-22 mb-0' style={{ whiteSpace: 'nowrap' }}>Step 2:</p>
                      <p className='fs-15 mb-0'>Simply hold your ASTRO for 100 Days and watch it auto-compound</p>
                    </div>
                    <div className='flex align-items-center gap-2'>
                      <p className='f-century-b fs-22 mb-0' style={{ whiteSpace: 'nowrap' }}>Step 3:</p>
                      <p className='fs-15 mb-0'>After 100 days, begin claiming 1% of your ASTRO each day</p>
                    </div>
                  </div>
                </div>
                <div className='col-md-12 mt-3'>
                  <span className='fs-18 f-century fw-bold ls-1 mt-2 mb-1'>CALCULATOR</span><br />
                  <p className='fs-14 text-gray mb-0'>Estimate your returns based on today's performance</p>
                </div>
                <div className='col-md-12'>
                  <div className='row'>
                    <div className='col-md-6 pb-3'>
                      <div className='input-form-control'>
                        <label className='input-label'>Astro Amount</label>
                        <div className="input-control">
                          <input type="number" name="amount" value={amount} className='input-main' onChange={handleAmount}></input>
                          <span className="input-suffix" onClick={handleMax}>MAX</span>
                        </div>
                      </div>
                    </div>
                    <div className='col-md-6 pb-3'>
                      <div className='input-form-control'>
                        <label className='input-label'>APY (%)</label>
                        <div className="input-control">
                          <input type="number" name="apy" value={apy} className='input-main' onChange={handleAPY}></input>
                          <span className="input-suffix" onClick={() => setAPY(DEF_APY)}>Current</span>
                        </div>
                      </div>
                    </div>
                    <div className='col-md-6 pb-3'>
                      <div className='input-form-control'>
                        <label className='input-label'>ASTRO Price at purchase ($)</label>
                        <div className="input-control">
                          <input type="number" name="purchasePrice" value={purchasePrice} className='input-main' onChange={handlePurchasePrice}></input>
                          <span className="input-suffix" onClick={() => setPurchasePrice(numberWithCommas(tokenPrice, 6))}>Current</span>
                        </div>
                      </div>
                    </div>
                    <div className='col-md-6 pb-3'>
                      <div className='input-form-control'>
                        <label className='input-label'>Future ASTRO Price ($)</label>
                        <div className="input-control">
                          <input type="number" name="futurePrice" value={futurePrice} className='input-main' onChange={handleFuturePrice}></input>
                          <span className="input-suffix" onClick={() => setFuturePrice(numberWithCommas(tokenPrice, 6))}>Current</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className='col-md-12 pb-2 px-4'>
                  <span className='fs-14'>{days} days</span>
                  <Slider
                    size="large"
                    defaultValue={30}
                    value={days}
                    step={1}
                    min={1}
                    max={365}
                    onChange={handleSlide}
                  />
                </div>
                <div className='col-md-12 px-4'>
                  <div className="flex flex-column gap-2">
                    <div className='flex justify-between'>
                      <label className='calc-label'>Your initial investment</label>
                      <span>${numberWithCommas(initAmount, 5)}</span>
                    </div>
                    <div className='flex justify-between'>
                      <label className='calc-label'>Current wealth</label>
                      <span>${numberWithCommas(wealth, 5)}</span>
                    </div>
                    <div className='flex justify-between'>
                      <label className='calc-label'>ASTRO rewards estimation</label>
                      <span>{numberWithCommas(rewardEst, 5)} ASTRO</span>
                    </div>
                    <div className='flex justify-between'>
                      <label className='calc-label'>Potential return</label>
                      <span>${numberWithCommas(potentialReturn, 5)}</span>
                    </div>
                    <div className='flex justify-between'>
                      <label className='calc-label'>Potential number of ASTRO Journeys</label>
                      <span>0</span>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
          <div className='col-xl-5 col-lg-12 align-items-stretch pb-3'>
            <Reveal keyframes={fadeInUp} className='onStep' delay={0} duration={800} triggerOnce>
              <div className='swap-title'>
                <span className='fs-18 mb-2'>&nbsp;</span>
              </div>
            </Reveal>
            <Reveal className='full-card text-center flex flex-column justify-center align-items-center full-height onStep'
              keyframes={fadeInUp} delay={400} duration={800} triggerOnce>
              <>
                <div className='main-card pb-2 full-width'>
                  <div className="flex align-items-center justify-between">
                    <div className='flex-column text-left'>
                      <span className='fs-24 f-century fw-bold ls-1 mb-0 text-left'>SWAP FOR ASTRO</span>
                      {coin_arrange ? (
                        <p className='f-medium'>Buy ASTRO below using <b>AVAX</b> or <b>USDC</b></p>
                      ) : (
                        <p className='f-medium'>Sell <b>ASTRO</b> below</p>
                      )}
                    </div>
                    <IconButton component="span" sx={{ color: '#ffb84d' }} onClick={handleOpen}>
                      <i className="fa-light fa-gear"></i>
                    </IconButton>
                  </div>
                  <div className="input-token-panel">
                    <div className='flex justify-between'>
                      <span className="fs-18 f-medium">From</span>
                      <span className='fs-18 f-medium cursor-pointer' onClick={() => handleSwapMax(1)}>Balance: {numberWithCommas(fromBalance)}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <input type="number" className="input-token" name="input_from" placeholder='0.0' value={tokenAmountA} onChange={onChangeTokenAmountA}></input>
                      {coin_arrange ? (
                        <button className='btn-max swap-color' onClick={() => handleFromPercent(100)}>MAX</button>
                      ) : (
                        <>
                          <button className='btn-max swap-color' onClick={() => handleFromPercent(20)}>20%</button>
                          <button className='btn-max swap-color' onClick={() => handleFromPercent(50)}>50%</button>
                        </>
                      )}
                      {coin_arrange ? (
                        <SelectCoin className='select-coin' value={coinType} onChange={handleSelectCoin} />
                      ) : (
                        <SelectCoin className='select-coin' value={2} coins={astro_coin} />
                      )}
                    </div>
                  </div>
                  <IconButton component="span" className="btn-change mt-2 mb-2 mx-auto w-10 h-10" onClick={onClick_ChangeCoin}>
                    <i className="fa-regular fa-arrow-down-arrow-up"></i>
                  </IconButton>
                  <div className="input-token-panel">
                    <div className='flex justify-between'>
                      <span className="fs-18 f-medium">To</span>
                      <span className='fs-18 f-medium cursor-pointer' onClick={() => handleSwapMax(2)}>Balance: {numberWithCommas(toBalance)}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <input type="number" className="input-token" name="input_from" placeholder='0.0' value={tokenAmountB} onChange={onChangeTokenAmountB}></input>
                      {coin_arrange ? (
                        <SelectCoin className='select-coin' value={2} coins={astro_coin} />
                      ) : (
                        <SelectCoin className='select-coin' value={coinType} onChange={handleSelectCoin} />
                      )}
                    </div>
                  </div>
                  <div className='flex flex-column mt-3'>
                    <div className='flex justify-between'>
                      <p className='text-gray'>Price</p>
                      <span className='fs-16'>{numberWithCommas(amountPerAstro, 8)} {coinType === 0 ? 'AVAX' : 'USDC'} per ASTRO</span>
                    </div>
                    <div className='flex justify-between'>
                      <p className='text-gray'>Slippage Tolerance</p>
                      <span className='fs-16'>{slippage} %</span>
                    </div>
                    <div className='flex justify-between'>
                      {coin_arrange ? (
                        <p className='text-center fs-14 text-gray mb-0'>Buy Tax (15%)</p>
                      ) : (
                        <>
                          <a className='text-center fs-14 text-gray hover:text-white cursor-pointer' data-tip data-for="main">Sell Tax (30%)</a>
                          <ReactToolTip className='tooltip' id="main" place={'top'} backgroundColor='#702ce9' textColor='white' type="dark" effect="solid" multiline={true}>
                            <span>Current Sell tax is subject to change. We've launched with 30% and will be reducing this % in the near term. We recommend holding your ASTRO.</span>
                          </ReactToolTip>
                        </>
                      )}
                      <span className='fs-16'>{numberWithCommas(tradingTax)}</span>
                    </div>
                  </div>
                  <div className='flex mt-2'>
                    {(tokenAmountA === '' || tokenAmountA === 0 || tokenAmountB === '' || tokenAmountB === 0) ? (
                      <button className="btn-swap" disabled>Enter an amount</button>
                    ) : (
                      <>
                        {insufficient ? (
                          <button className="btn-swap" disabled>Insufficient {coinLabel(coin_arrange, coinType)} balance</button>
                        ) : (
                          <>
                            {priceImpact > 90 ? (
                              <button className="btn-swap" disabled>Insufficient liquidity for this trade.</button>
                            ) : (
                              <>
                                {priceImpact >= 15 ? (
                                  <button className="btn-swap" disabled>Price Impact Too High</button>
                                ) : (
                                  <>
                                    {coin_arrange ? !isApprovedUSDC && (
                                      <button className="btn-swap approve" onClick={onClick_ApproveUSDC}>Approve USDC</button>
                                    ) : !isApprovedASTRO && (
                                      <button className="btn-swap approve" onClick={onClick_ApproveASTRO}>Approve ASTRO</button>
                                    )}
                                    <button className="btn-swap" onClick={handleSwap} disabled={coin_arrange ? !isApprovedUSDC && 'disabled' : !isApprovedASTRO && 'disabled'}>SWAP</button>
                                  </>
                                )}
                              </>
                            )}
                          </>
                        )}
                      </>
                    )}

                    {/* 
                    {(tokenAmountA === '' || tokenAmountA === 0 || tokenAmountB === '' || tokenAmountB === 0) ? (
                      <button className="btn-swap" disabled>Enter an amount</button>
                    ) : (insufficient ? (
                      <>
                        <button className="btn-swap" disabled>Insufficient {coinLabel(coin_arrange, coinType)} balance</button>
                      </>
                    ) : (
                      <>
                        {coin_arrange ? !isApprovedUSDC && (
                          <button className="btn-swap approve" onClick={onClick_ApproveUSDC}>Approve USDC</button>
                        ) : !isApprovedASTRO && (
                          <button className="btn-swap approve" onClick={onClick_ApproveASTRO}>Approve ASTRO</button>
                        )}
                        <button className="btn-swap" onClick={handleSwap} disabled={coin_arrange ? !isApprovedUSDC && 'disabled' : !isApprovedASTRO && 'disabled'}>SWAP</button>
                      </>
                    ))} */}
                  </div>
                  <div className='flex justify-center align-items-center gap-3 mt-2 cursor-pointer' onClick={addTokenCallback}>
                    <img src="/img/icons/metamask.png" alt="" width="30"></img>
                    <span className='fs-14'> Add ASTRO token to MetaMask</span>
                  </div>
                </div>
                <div className='main-card flex flex-column full-width mt-2' style={{ height: '120px' }}>
                  <div className='flex justify-between'>
                    {exactToken ? (
                      <p className='text-gray'>Minimum received</p>
                    ) : (
                      <p className='text-gray'>Maximum sold</p>
                    )}
                    <p>{numberWithCommas(amountMinMax, 5)} {receiveCoinType}</p>
                  </div>
                  <div className='flex justify-between'>
                    <p className='text-gray'>Price Impact</p>
                    <p className={priceImpact < 3 ? 'text-green' : priceImpact < 15 ? 'text-warning' : 'text-error'}>{priceImpact < 0.01 ? '< 0.01%' : priceImpact + '%'}</p>
                  </div>
                  <div className='flex justify-between'>
                    <p className='text-gray'>Liquidity Provider Fee</p>
                    <p>{numberWithCommas(providerFee, 8)} {coinLabel(coin_arrange, coinType)}</p>
                  </div>
                </div>
              </>
            </Reveal>
          </div>
        </div>
      </div>
      <Modal
        open={openModal}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Settings
          </Typography>
          <div id="modal-modal-description" className="mt-3">
            <div className="flex flex-column">
              <p className='text-gray'>Slippage tolerance</p>
              <div className="d-flex justify-content-between gap-2">
                <div className='slippage-form flex align-items-center'>
                  <input type="number" className="input-slippage" name="input_from" placeholder='0.0' onChange={(e) => handleSlippage(e.target.value)}></input>
                  <span className='fs-20 text-white px-2'>%</span>
                </div>
                <div className='flex align-items-center'>
                  <Chip label="0.1%" className='fs-20' variant={slippage === 0.1 ? 'filled' : ''} onClick={() => handleSlippage(0.1)} />
                  <Chip label="0.5%" className='fs-20' variant={slippage === 0.5 ? 'filled' : ''} onClick={() => handleSlippage(0.5)} />
                  <Chip label="1.0%" className='fs-20' variant={slippage === 1 ? 'filled' : ''} onClick={() => handleSlippage(1)} />
                  <Chip label="Auto" className='fs-20' variant={slippage === 0 ? 'filled' : ''} onClick={() => handleSlippage(AUTO_SLIPPAGE)} />
                </div>
              </div>
            </div>
          </div>
        </Box>
      </Modal>
    </div >
  );
};

export default Swap;