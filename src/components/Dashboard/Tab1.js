import React, { useEffect } from "react";
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import * as selectors from '../../store/selectors';
import { config } from "../../core/config";

function Tab1() {
    const web3 = useSelector(selectors.web3State);
    const chainId = useSelector(selectors.authChainID);

    useEffect(() => {
        if (web3 !== null && chainId !== '' && web3.utils.toHex(chainId) !== web3.utils.toHex(config.chainId)) {
            toast.error('Please change the network to Goerli');
        }
    }, [web3, chainId]);

    return (
        <div></div>
    );
}

export default Tab1;