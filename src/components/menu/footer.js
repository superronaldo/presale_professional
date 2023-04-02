import React from 'react';

const footer = () => (
    <footer className="footer-light">
        <div className="container">
            <div className="flex flex-column">
                <div className="social-icons flex justify-content-center" data-aos='fade-up' data-aos-delay='300' data-aos-duration="800">
                    <a href="https://twitter.com/SOLIDARITytoke1" target="_blank" rel="noreferrer"><i className="fa-brands fa-twitter"></i></a>
                    <a href="https://t.me/solidarityfinance" target="_blank" rel="noreferrer"><i className="fa-brands fa-telegram"></i></a>
                    
                </div>
                <div className='align-self-center' data-aos='fade-up' data-aos-delay='300' data-aos-duration="800">
                   
                    <div className='mt-5'>
                        <span className='text-white'>&copy; Copyright 2023</span>
                    </div>
                </div>
            </div>
        </div>
    </footer>
);
export default footer;