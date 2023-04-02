import React, { useState, useRef } from "react";
import copy from "copy-to-clipboard";
import { useSelector } from 'react-redux';
import ReactLoading from 'react-loading';
import { toast } from 'react-toastify';
import * as selectors from '../../store/selectors';
import { config } from "../../core/config";

import logo from './../../assets/img/icon/gpwr-logo-w.svg';
import eth_img from './../../assets/img/icon/ethereum-logo.svg';
import metamask from './../../assets/img/logo/metamask-logo.svg';
import walletcon from './../../assets/img/logo/walletconnect-logo.svg';

function Tab3(props) {
    const inputArea = useRef(null);

    const[eth, setEth] = useState('');
    const[gpwr, setGpwr] = useState('');

    const userWalletState = useSelector(selectors.userWallet);
    const web3 = useSelector(selectors.web3State);
    const pending = useSelector(selectors.loadingState);

    const chainId = useSelector(selectors.authChainID);
    const balance = useSelector(selectors.userBalance);

    const refferUrl = "https://www.gameempower.com/?ref=";

    const handleClickBuy = () => {
        props.handleBuyWithEth(eth)
    }

    const handleChangeETH = async (event) => {
        setEth(Number(event.target.value));
        setGpwr(Number(event.target.value) * props.tokenRates * 10);
    }
    const handleChangeGPWR = async (event) => {
        setEth(Number(event.target.value) / (props.tokenRates * 10));
        setGpwr(Number(event.target.value));
    }

    const copyToClipboard = () => {
        copy(inputArea.current.value);
    }

    return (
        <div>
            <div className="row mt-3 p-3">
                <div className="col-md-2">
                    <img src={logo} className='logo-img mx-auto img-width-75' alt="small-logo" />
                </div>
                <div className="col-md-8 text-center">
                    <h5><strong>{props.tokenRates} GPWR = 0.1 ETH</strong></h5>
                </div>
                <div className="col-md-2">
                    <img src={eth_img} className='logo-img mx-auto' alt="eth-img" />
                </div>
            </div>
            <div className="row">
                <div className="col-md-12 text-center">
                    <span className="text-success font-size-10 p-1"><strong>Bonus 3% from $1000 purchase, bonus 5% from $2000</strong></span>
                </div>
            </div>
            <div className="row pt-2">
                <div className="col-md-12 text-center">
                    {(props.day < 0 || props.hour < 0 || props.minute < 0 || props.second < 0) ? (
                        <h5><strong>0&nbsp;&nbsp;:&nbsp;&nbsp;0&nbsp;&nbsp;:&nbsp;&nbsp;0&nbsp;&nbsp;:&nbsp;&nbsp;0</strong></h5>
                    ):(
                        <h5><strong>{props.day}&nbsp;&nbsp;:&nbsp;&nbsp;{props.hour}&nbsp;&nbsp;:&nbsp;&nbsp;{props.minute}&nbsp;&nbsp;:&nbsp;&nbsp;{props.second}</strong></h5>
                    )}
                </div>
            </div>
            <div className="row">
                <div className="col-md-12 text-center">
                    <span><strong>Days&nbsp;&nbsp;Hours&nbsp;&nbsp;Minutes&nbsp;&nbsp;Seconds</strong></span>
                </div>
            </div>
            <div className="row pt-3">
                <div className="col-md-12">                    
                    <div className="progress">  
                        <div className="progress-bar bg-danger progress-status text-center" id="progressbar_3" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                        </div>                        
                    </div>
                </div>
            </div>
            <div className="row margin-19">
                <div className="col-md-12">
                    <div className="text-body text-center font-weight-bold">Remaining Until Price Change</div>
                </div>
            </div>
            <div className="row pt-3">
                <div className="col-md-12 text-center">
                    <h5><strong>AMOUNT RAISED&nbsp;:&nbsp;{props.presaleAmount}&nbsp;ETH</strong></h5>
                </div>
            </div>
            {web3 !== null && chainId !== '' && web3.utils.toHex(chainId) !== web3.utils.toHex(config.chainId) ? (
                <div className="row pt-3 px-5">
                    <div className="col-md-12 text-center">
                        <button type="button" className="btn btn-con p-2 mb-2" onClick={props.onConnect}>SWITCH NETWORK</button>
                        <div className="custom-search">
                            <input type="text" readOnly className="custom-search-input" value={''} />
                            <button className="custom-search-botton" type="button">copy</button>  
                        </div>
                    </div>
                </div>
            ) : (chainId === '' || userWalletState === '' || userWalletState === 0 ? (
                <div className="row pt-3 px-5">
                    <div className="col-md-12 text-center">
                        <button type="button" className="btn btn-con p-2 mb-2" onClick={props.onConnect}>CONNECT WALLET</button>
                        <div className="custom-search">
                            <input type="text" readOnly className="custom-search-input" value={''} />
                            <button className="custom-search-botton" type="button">copy</button>  
                        </div>
                    </div>
                </div>
            ) : (
            <>
                {
                    pending ? (
                        <div className="row pt-3 px-5">
                            <div className="col-md-12 text-center">
                                <button type="button" className="btn btn-con p-2 mb-2"><ReactLoading type={'spin'} width="25px" height="25px" color="#fff" /><span className="text-gray">Pending...</span></button>
                            </div>
                        </div>
                    ) : (
                        // <button className="btn btn-con p-2 mb-2" onClick={onDisconnect}><span>{userWalletState && (userWalletState.slice(0, 4) + "..." + userWalletState.slice(38))}</span></button>
                        <div className="row pt-3 px-5">
                            <h6 className="text-center">Your ETH Amount&nbsp;&nbsp;:&nbsp;&nbsp;{balance.avaxBalance}</h6>
                            <div className="col-md-4 mb-2 text-center align-self-end">
                                <input type="number" name="eth" placeholder="0.0" min="1" max="50000" value={eth} className="input-class w-100" onChange={handleChangeETH} />
                                <label>ETH</label>
                            </div>
                            <div className="col-md-4 mb-2 text-center align-self-end">
                                <input type="number" name="gpwr" placeholder="0.0" min="1" max="50000" value={gpwr} className="input-class w-100" onChange={handleChangeGPWR} />
                                <label>GPWR</label>
                            </div>
                            {props.isfinished == false ? (
                                <div className="col-md-4 mb-2 text-center">
                                    <button className="btn btn-con p-2" onClick={handleClickBuy}>BUY</button>
                                </div>
                            ):(
                                <div className="col-md-4 mb-2 text-center">
                                    <button className="btn btn-con p-2" onClick={props.handleClaim}>CLAIM</button>
                                </div>
                            )}
                            <button className="btn btn-con p-2 mb-2 w-75 mx-auto" onClick={props.onDisconnect}><span>{userWalletState && (userWalletState.slice(0, 4) + "..." + userWalletState.slice(38))}</span></button>
                            <div className="custom-search">
                                <input ref={inputArea} type="text" readOnly className="custom-search-input" value={refferUrl+userWalletState} />
                                <button className="custom-search-botton" type="button" onClick={copyToClipboard}>copy</button>  
                            </div>
                        </div>
                    )
                }
            </>
            ))}
            <div className="row pt-1">
                <div className="col-md-12 text-center">
                    <p><strong>Presale Ends May 31st</strong></p>
                </div>
            </div>
            {/* <div className="row">
                <button type="button" className="btn btn-danger mx-auto" onClick={onBuy}><span>BUY</span></button>
            </div> */}
            <div className="row pt-2 p-2">
                <div className="col-md-6 pb-4">
                    <img src={metamask} className='mx-auto img-width-50' alt="metamask" />
                </div>
                <div className="col-md-6 pb-4">
                    <img src={walletcon} className='mx-auto img-width-50' alt="metamask" />
                </div>
            </div>
        </div>
        
    );
}

export default Tab3;