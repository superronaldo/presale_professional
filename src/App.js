import './App.css';
import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { LocationProvider } from '@reach/router';
import { toast } from 'react-toastify';
import { connectWallet, disconnect } from './core/web3';
import { config } from "./core/config";
import 'aos/dist/aos.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { getUTCNow, isEmpty } from './components/utils';
import {
    getClaimableBalance,
    getUserPaidUSDT,
    getStartPresaleTime,
    getEndPresaleTime,
    getTokensRates,
    buy_pToken,
    claim_pToken,
} from './core/web3';
import Swal from 'sweetalert2';

import Tab1 from './components/Dashboard/Tab1';
import Tab2 from './components/Dashboard/Tab2';
import Tab3 from './components/Dashboard/Tab3';
import Tab4 from './components/Dashboard/Tab4';

import * as selectors from './store/selectors';

import logo from './assets/img/logo/logo.svg';
import tel from './assets/img/icon/telegram-icon.svg';
import twitter from './assets/img/icon/twitter-icon.svg';
import discord from './assets/img/icon/discord-icon.svg';

function App() {
  const userWalletState = useSelector(selectors.userWallet);
  const web3 = useSelector(selectors.web3State);
  const chainId = useSelector(selectors.authChainID);

  const Ref = useRef(null);
  const [day, setDay] = useState(0);
  const [hour, setHour] = useState(0);
  const [minute, setMinute] = useState(0);
  const [second, setSecond] = useState(0);
  const [presaleUSDTAmount, setPresaleUSDTAmount] = useState(0);
  const [presaleETHAmount, setPresaleETHAmount] = useState(0);
  const [claimableBalance, setClaimableBalance] = useState(0);

  const [flag, setFlag] = useState(false);
  const[isfinished, setIsfinished] = useState(false);

  const [tokensPerEth, setTokensPerEth] = useState(0);
  const [tokensPerUsdt, setTokensPerUsdt] = useState(0);

  const [start_time, setStartTime] = useState(1678786148);
  const [end_time, setEndtTime] = useState(1688169599);

  const balance = useSelector(selectors.userBalance);

  const validateUsdt = (usdt) => {
    if (isEmpty(usdt) || Number(usdt) === 0) {
        toast.error("Please enter a valid amount for purchase.");
        return;
    }

    if ((Number(balance.usdtBalance) < Number(usdt))) {
        toast.error("You have insufficient amount to buy GPWR.");
        return false;
    }
    if (Number(start_time) * 1000 > getUTCNow()) {
        toast.error("Presale has not started yet.");
        return false;
    } else if (Number(end_time) * 1000 < getUTCNow()) {
        toast.error("Presale has ended.");
        setIsfinished(true);
        return false;
    }

    return true;
  }

  const validateEth = (eth) => {
    if (isEmpty(eth) || Number(eth) === 0) {
        toast.error("Please enter a valid amount for purchase.");
        return;
    }

    if ((Number(balance.avaxBalance) < Number(eth))) {
        toast.error("You have insufficient amount to buy GPWR.");
        return false;
    }
    if (Number(start_time) * 1000 > getUTCNow()) {
        toast.error("Presale has not started yet.");
        return false;
    } else if (Number(end_time) * 1000 < getUTCNow()) {
        toast.error("Presale has ended.");
        setIsfinished(true);
        return false;
    }

    return true;
  }

  const handleBuyWithUsdt = async (usdt) => {
    if (!validateUsdt(usdt)) return;
    const urlParams = new URLSearchParams(window.location.search);
    let ref = urlParams.get('ref');

    try {
        const result = await buy_pToken(0, ref, usdt * 10 ** 6);
        if (result.success) {
            // getInitAmount();
            Swal.fire({
                icon: 'success',
                title: ' Success',
                text: 'You have bought GPWR for presale successfully.'
            });

            setFlag(false);
        } else {
            toast.error("Transaction has been failed. " + result.error);
        }
    } catch (error) {
        toast.error("Transaction has been failed. " + error);
    }
  }

  const handleBuyWithEth = async (eth) => {
    if (!validateEth(eth)) return;
    const urlParams = new URLSearchParams(window.location.search);
    let ref = urlParams.get('ref');
    try {
        const result = await buy_pToken(1, ref, eth);
        if (result.success) {
            // getInitAmount();
            Swal.fire({
                icon: 'success',
                title: ' Success',
                text: 'You have bought GPWR for presale successfully.'
            });

            setFlag(false);
        } else {
            toast.error("Transaction has been failed. " + result.error);
        }
    } catch (error) {
        toast.error("Transaction has been failed. " + error);
    }
  }

  const handleClaim = async () => {
    try {
        const result = await claim_pToken();
        if (result.success) {
            // getInitAmount();
            Swal.fire({
                icon: 'success',
                title: ' Success',
                text: 'You have claimed GPWR successfully.'
            });

            setFlag(false);
        } else {
            toast.error("Transaction has been failed. " + result.error);
        }
    } catch (error) {
        toast.error("Transaction has been failed. " + error);
    }
  }

  const onConnect = async () => {
    await connectWallet();
  }

  const onDisconnect = async () => {
    await disconnect();
  }

  useEffect(() => {
    const getInitAmount = (async () => {
      // let result = await getStartPresaleTime();
      // if (result.success) {
      //     setStartTime(Number(result.start_time));
      // } else {
      //     return;
      // }

      // result = await getEndPresaleTime();
      // if (result.success) {
      //     setEndtTime(Number(result.end_time));
      // } else {
      //     return;
      // }

      let result = await getUserPaidUSDT();
      if (result.success) {
          setPresaleUSDTAmount(result.paidUSDT);
          setPresaleETHAmount(result.paidETH);
      } else {
          return;
      }

      result = await getClaimableBalance();
      if (result.success) {
          setClaimableBalance(result.claimable);
      } else {
          return;
      }

      result = await getTokensRates();
      if (result.success) {
          setTokensPerEth(result.pTokensPerETH);
          setTokensPerUsdt(result.pTokensPerUSDT);
      } else {
          return;
      }

      setFlag(true);
    });

    const setConfig = () => {
      let duration = (end_time - start_time) * 1000;
      let diff_time = end_time * 1000 - getUTCNow();

      let day_split = Math.floor(diff_time / 1000 / 60 / 60 / 24);
      
      if (day_split > 99)
          setDay(99);
      else
          setDay(day_split);
      
      let hour_split = Math.floor((diff_time / 1000 / 60 / 60) % 24);
      setHour(hour_split);

      let min_split = Math.floor((diff_time / 1000 / 60) % 60);
      setMinute(min_split);

      let second_split = Math.floor((diff_time / 1000) % 60);
      setSecond(second_split);

      const elem2 = document.getElementById('progressbar_2');
      const elem3 = document.getElementById('progressbar_3');

      let temp = (100 - ((diff_time / duration) * 100)) + '%';
      elem2.style.width = temp;
      elem3.style.width = temp;
    }
    
    const clearTimer = () => {
      if (Ref.current) clearInterval(Ref.current);
      const id = setInterval(() => {
          if(!flag)
            getInitAmount();
          setConfig();
      }, 1000)
      Ref.current = id;
    }
    clearTimer();
  }, [end_time, flag, start_time]);

  return (
    <LocationProvider>
      <div className='container container-pad'>
        <div className='row pt-2'>
          <div className='col-md-3'>
            <a className="navbar-brand" href="/">
              <img src={logo} className="logo-img" alt="logo" />
            </a>
          </div>
          <div className='col-md-1'></div>
          <div className='col-md-8'>
            <nav className='navbar navbar-expand-sm float-right'>
              <ul className="navbar-nav">
                <li className="nav-item menu-item mr-4 text-center">
                  <a className="nav-link" href="/">Home</a>
                </li>
                <li className="nav-item menu-item mr-4 text-center">
                  <a className="nav-link" href="/">Whitepaper</a>
                </li>
                <li className="nav-item menu-item mr-4 text-center">
                  <a className="nav-link" href="/">How to buy?</a>
                </li>
                <li className="nav-item menu-item mr-4 text-center">
                  <a className="nav-link" href="/">Roadmap</a>
                </li>
                <li className="nav-item menu-item mr-4 text-center">
                  <a className="nav-link" href="/">New to Crypto?</a>
                </li>
                <li className="nav-item menu-item mr-4 text-center">
                  <a className="nav-link" href="/">Blog</a>
                </li>
                <li className="nav-item menu-item mr-4">
                  <a className="nav-link" href="/">
                    <img src={tel} alt="tel-img" className='mx-auto'></img>
                  </a>
                </li>
                <li className="nav-item menu-item mr-4">
                  <a className="nav-link" href="/">
                    <img src={twitter} alt="twitter-img" className='mx-auto'></img>
                  </a>
                </li>
                <li className="nav-item menu-item mr-4">
                  <a className="nav-link" href="/">
                    <img src={discord} alt="discord-img" className='mx-auto'></img>
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
        <div className='row pt-4 pb-3'></div>
        <div className='row'>
          <div className='col-md-7 mt-3'>
            <div className='left-bg-color p-5'>
              <div className='row pb-3'>
                <div className='col-md-12'>
                  <h3><strong>Invite your friends</strong> and earn $GPWT Token</h3>
                  <p>Share your Artifact referral link with your friends and business partners and get reward for every successful sale of $GPWT tokens from three levels</p>
                </div>
              </div>
              <div className='container-fluid mask'>
                <div className='row pt-3 pb-3'>
                  <div className='col-md-9'>
                    <p className='text-success'><strong>Start earning commission today</strong></p>
                    <h5 className='text-primary'><strong>Connect Your Wallet to Get Your Affiliate URL</strong></h5>
                  </div>
                  <div className='col-md-3'>
                    {web3 !== null && chainId !== '' && web3.utils.toHex(chainId) !== web3.utils.toHex(config.chainId) ? (
                      <button className='btn btn-bg-gray p-2' type='button' onClick={onConnect}><strong>SWITCH</strong></button>
                    ):(chainId === '' || userWalletState === '' || userWalletState === 0 ? (
                      <button className='btn btn-bg-gray p-2' type='button' onClick={onConnect}><strong>CONNECT</strong></button>
                    ):(
                      <button className='btn btn-bg-gray p-2' type='button' onClick={onDisconnect}><strong>{userWalletState && (userWalletState.slice(0, 4) + "..." + userWalletState.slice(38))}</strong></button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className='row pt-3 pb-3'>
                <div className='col-md-12'>
                  <span><strong>Step1</strong></span>
                  <p>Connect your wallet to get a referral link</p>
                </div>
              </div>
              <div className='row pb-3'>
                <div className='col-md-12'>
                  <span><strong>Step2</strong></span>
                  <p>Invite your friends to register via your referral link</p>
                </div>
              </div>
              <div className='row pb-3'>
                <div className='col-md-12'>
                  <span><strong>Step3</strong></span>
                  <p>Get referral rewards in $GPWT tokens from the number of purchased tokens by your friends</p>
                </div>
              </div>
              <div className='row pb-3'>
                <div className='col-md-12'>
                  <p>You can earn three levels of referrals Level 1 (5%), Level 2 (3%), Level 3(2%)</p>
                </div>
              </div>
            </div>
          </div>
          <div className='col-md-1'></div>
          <div className='col-md-4'>
            <div className='container-fluid'>
              <div className='row pt-3'>
                {(chainId === '' || userWalletState === '' || userWalletState === 0 ? (
                  <p className='p-1 text-center text-body-wrap'>Your wallet is not connected to this site.</p>
                ) : (
                  <>
                    <p className='p-1 text-center text-body-wrap'>Your Claimable $GPWR Token Balance is <strong>{claimableBalance}</strong></p>
                  </>
                ))
                }
              </div>
            </div>
            <div className='left-bg-color'>
              <Tabs
                defaultActiveKey="home"
                id="uncontrolled-tab-example"
              >
                <Tab eventKey="static-text" title="BUY WITH: ">
                  <Tab1 />
                </Tab>
                <Tab eventKey="home" title="Home">
                  <Tab2 day={day} hour={hour} minute={minute} second={second} presaleAmount={presaleUSDTAmount} start_time={start_time} end_time={end_time} tokenRates={tokensPerUsdt} isfinished={isfinished} handleBuyWithUsdt={handleBuyWithUsdt} handleClaim={handleClaim} onConnect={onConnect} onDisconnect={onDisconnect} />
                </Tab>
                <Tab eventKey="profile" title="Home">
                  <Tab3 day={day} hour={hour} minute={minute} second={second} presaleAmount={presaleETHAmount} start_time={start_time} end_time={end_time} tokenRates={tokensPerEth} isfinished={isfinished} handleBuyWithEth={handleBuyWithEth} handleClaim={handleClaim} onConnect={onConnect} onDisconnect={onDisconnect} />
                </Tab>
                <Tab eventKey="contact" title="Home">
                  <Tab4 />
                </Tab>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover={false}
      />
    </LocationProvider>
  );
}

export default App;
