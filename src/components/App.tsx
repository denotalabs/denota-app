import { Tabs, Tab, Form } from 'react-bootstrap';
import React, { useEffect, useState } from 'react';
import dchequeImage from '../dcheque.png';
import { ethers } from 'ethers';
import './App.css';
import useBlockchainData from './hooks/useBlockchainData';

function App() {
  const [depositAmount, setDepositAmount] = useState('');

  const [amount, setAmount] = useState('');

  const [reviewer, setReviewer] = useState('');
  const [bearer, setBearer] = useState('');
  const [expiry, setExpiry] = useState('');
  const [chequeID, setChequeID] = useState('');  // Depositing doesn't yield a chequeID
  const [duration] = useState('');
  const [userType2, setUserType2] = useState<any>('');
  const [userType3, setUserType3] = useState('');
  const [acceptedAddress, setAcceptedAddress] = useState('');

  const { state, loadBlockchainData } = useBlockchainData();

  useEffect(() => {
    loadBlockchainData();
  }, [loadBlockchainData]);

  const listItems = state.acceptedUserAuditors.map((auditor) =>
  <li key={auditor}>
    {auditor}
  </li>
);

  return (
    <div className='text-monospace'>
      <nav className='navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow'>
        <a
          className='navbar-brand col-sm-3 col-md-2 mr-0'
          target='_blank'
          rel='noopener noreferrer'
        >
          <img src={dchequeImage} className='App-logo' alt='logo' height='32' />
          <b> dCheque</b>
        </a>
        <h6 style={{ color: 'rgb(255, 255, 255)', marginRight: '20px' }}>
          Balance: {state.userBalance} ETH
        </h6>
      </nav>

      <div className='container-fluid mt-5 text-center'>
        <br></br>
        <h1>Welcome to dCheque</h1>
        <h6>Total deposited: {state.dChequeBalance} ETH</h6>
        
        <br></br>
        <div className='row'>
          <main role='main' className='col-lg-12 d-flex text-center'>
            <div className='content mr-auto ml-auto'>
              <Tabs defaultActiveKey='deposit' id='uncontrolled-tab-example'>
                <Tab eventKey='deposit' title='Deposit'>
                  <div>
                    <br></br>
                    How much do you want to deposit?
                    <br></br>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const weiAmount = ethers.utils.parseEther(
                          depositAmount.toString()
                        ); //convert to wei
                        state.signer?.sendTransaction({
                          to: state.dChequeAddress,
                          value: weiAmount,
                        });
                      }}
                    >
                      <div className='form-group mr-sm-2'>
                        <br></br>
                        <input
                          id='depositAmount'
                          step='0.01'
                          type='number'
                          className='form-control form-control-md'
                          placeholder='Amount...'
                          required
                          onChange={(e) => {
                            setDepositAmount(e.target.value);
                          }}
                        />
                      </div>
                      <button type='submit' className='btn btn-primary'>
                        Deposit
                      </button>
                    </form>
                  </div>
                </Tab>
                <Tab eventKey='write' title='Write'>
                  <div>
                    <br></br>
                    <form
                      className='form-group mr-sm-2'
                      onSubmit={(e) => {
                        e.preventDefault();
                        const amountWei = ethers.utils.parseEther(amount).toString(); console.log(amountWei, typeof amountWei);
                        console.log(duration, reviewer, bearer)
                        state.dcheque?.functions['writeCheque(uint256,uint256,address,address)'](
                          duration,
                          reviewer.toString(),
                          bearer.toString()
                        );
                      }}
                    >
                      <div>
                        <br></br>
                        <input
                          id='bearer'
                          type='text'
                          className='form-control form-control-md'
                          placeholder='Recieving Account...'
                          required
                          onChange={(e) => {
                            setBearer(e.target.value);
                          }}
                        />
                      </div>
                      <div>
                        <br></br>
                        <input
                          id='reviewer'
                          type='text'
                          className='form-control form-control-md'
                          placeholder='Reviewing Account...'
                          required
                          onChange={(e) => {
                            setReviewer(e.target.value);
                          }}
                        />
                      </div>
                      <div>
                        <br></br>
                        <input
                          id='expiry'
                          type='number'
                          className='form-control form-control-md'
                          placeholder='To Expire In...'
                          required
                          onChange={(e) => {
                            setExpiry(e.target.value);
                          }}
                        />
                      </div>
                      <div>
                        <br></br>
                        <input
                          id='amount'
                          type='number'
                          className='form-control form-control-md'
                          placeholder='Amount...'
                          required
                          onChange={(e) => {
                            setAmount(e.target.value);
                          }}
                        />
                      </div>
                      <div className='form-group mt-5'>
                        <button type='submit' className='btn btn-primary'>
                          Sign
                        </button>
                      </div>
                    </form>
                  </div>
                </Tab>
                <Tab eventKey='cash' title='Cash'>
                  <div>
                    <br></br>
                    You have {state.userChequeCount} Cheque(s):
                    <br></br>
                    {state.userCheques}
                    {/* <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        state.dcheque?.cashCheque(chequeID);
                      }}
                    >
                      <div className='form-group mr-sm-2'>
                        <br></br>
                        <input
                          id='depositAmount'
                          step='1'
                          type='number'
                          className='form-control form-control-md'
                          placeholder='Cheque Identifier'
                          required
                          onChange={(e) => {
                            setChequeID(e.target.value);
                          }}
                        />
                      </div>
                      <button type='submit' className='btn btn-primary'>
                        Cash Cheque
                      </button>
                    </form> */}
                  </div>
                </Tab>
                <Tab eventKey='Auditors' title='Auditors'>
                  <br></br>
                  You are a(n) _ and adding account for...
                  <br></br>
                  <br></br>
                  <Form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (userType2.checked) {
                        // user accepts this auditor
                        state.dcheque?.acceptAuditor(acceptedAddress);
                      } else {
                        // auditor accepts this user
                        state.dcheque?.acceptUser(acceptedAddress);
                        state.dcheque?.setAllowedDuration(60 * 60 * 24 * 7);
                      }
                    }}
                  >
                    <div key={`inline-${'radio'}`} className='mb-3'>
                      <Form.Check
                        ref={(input: any) => {
                          setUserType2(input);
                        }}
                        defaultChecked={true}
                        inline
                        label='User'
                        value='1'
                        name='group1'
                        type={'radio'}
                        id={`inline-${'radio'}-2`}
                      />
                      <Form.Check
                        ref={(input: any) => {
                          setUserType3(input);
                        }}
                        inline
                        label='Auditor'
                        value='2'
                        name='group1'
                        type={'radio'}
                        id={`inline-${'radio'}-3`}
                      />
                    </div>
                    <input
                      id='acceptedAddress'
                      type='text'
                      className='form-control form-control-md mt-2'
                      placeholder='Address...'
                      required
                      onChange={(e) => {
                        setAcceptedAddress(e.target.value);
                      }}
                    />
                    <div>
                      <button type='submit' className='btn btn-primary mt-3'>
                        Add Address
                      </button>
                    </div>
                  </Form>
                  <br></br>
                  Your Auditors: {listItems}
                  <br></br>
                  Your Users: {state.acceptedAuditorUsers}
                </Tab>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
