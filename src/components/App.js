import { Tabs, Tab, Form } from 'react-bootstrap'
import dCheque from '../abis/dCheque.json'
import React, { Component } from 'react';
import dchequeImage from '../dcheque.png';
import { ethers } from 'ethers';
import './App.css';

class App extends Component {

  async componentWillMount() {
    await this.loadBlockchainData(this.props.dispatch)
  }

  async connectWallet() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);// console.log(provider) //, window.ethereum, 5777 'http://localhost:8545'
    await provider.send("eth_requestAccounts", []);
    provider.on("network", (newNetwork, oldNetwork) => {if (oldNetwork) {window.location.reload();}});  // Reload on network change
    const signer = provider.getSigner(); //console.log(provider)
    let account = await signer.getAddress(); //console.log(account)
    let netId = 5777
    return [provider, signer, account, netId]
  }

  async loadBlockchainData(dispatch) {
    if(typeof window.ethereum !== 'undefined'){
      let [provider, signer, account, netId] = await this.connectWallet(); //console.log(provider, signer, account, netId)
      try { // Load contracts
        const dChequeAddress = await dCheque.networks[netId].address;
        let dcheque = new ethers.Contract(dChequeAddress, dCheque.abi, signer);
        window.dCheque = dcheque
        const dChequeBalance = await provider.getBalance(dChequeAddress);
        let userBalance = await dcheque.deposits(account)
        this.setState({signer:signer, account: account, 
                       dcheque: dcheque, dChequeAddress: dChequeAddress,
                       dChequeBalance: ethers.utils.formatEther(dChequeBalance), 
                       userBalance:ethers.utils.formatEther(userBalance)
                      }) 
      } catch (e){
        console.log('error', e)
        window.alert('Contracts not deployed to the current network')
      }
    } else{  //if MetaMask not exists push alert
      window.alert('Please install MetaMask')
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      web3: 'undefined',
      account: '',
      dcheque: null,
      dChequeAddress: null,
      dChequeBalance: 0,
      userBalance: 0
    }
  }

  render() {
    return (
      <div className='text-monospace'>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          <a
            className="navbar-brand col-sm-3 col-md-2 mr-0"
            target="_blank"
            rel="noopener noreferrer"
          >
        <img src={dchequeImage} className="App-logo" alt="logo" height="32"/>
          <b>dCheque</b>
        </a>
        <h6 style={{color: "rgb(255, 255, 255)", marginRight:'20px'}}>Balance: {this.state.userBalance} ETH</h6>
        </nav>
        <div className="container-fluid mt-5 text-center">
        <br></br>
          <h1>Welcome to dCheque</h1>
          <h6>Total deposited: {this.state.dChequeBalance} ETH</h6>
          
          <br></br>
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
              <Tabs defaultActiveKey="deposit" id="uncontrolled-tab-example">
                <Tab eventKey="deposit" title="Deposit">
                  <div>
                    <br></br>
                    How much do you want to deposit?
                    <br></br>
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      let amount = this.depositAmount.value
                      amount = ethers.utils.parseEther(amount.toString(), 'wei') //convert to wei
                      this.state.signer.sendTransaction({to: this.state.dChequeAddress, value: amount});
                    }}>
                      <div className='form-group mr-sm-2'>
                      <br></br>
                        <input
                          id='depositAmount'
                          step="0.01"
                          type='number'
                          className="form-control form-control-md"
                          placeholder='Amount...'
                          required
                          ref={(input) => { this.depositAmount = input}}
                        />
                      </div>
                      <button type='submit' className='btn btn-primary'>Deposit</button>
                    </form>
                  </div>
                </Tab>
                <Tab eventKey="write" title="Write">
                  <div>
                    <br></br>
                    <form className='form-group mr-sm-2' onSubmit={(e) => {
                      e.preventDefault()
                      let amount = this.amount.value; 
                      amount = ethers.utils.parseEther(amount); //console.log(amount)
                      let [duration, auditor, bearer] = [this.expiry.value, this.reviewer.value, this.bearer.value]; console.log(duration, auditor, bearer)
                      if (this.state.dcheque!==null){
                        this.state.dcheque.functions['writeCheque(uint256,uint256,address,address)'](amount, duration, auditor, bearer)
                      }
                    }}>
                      <div>
                        <br></br>
                          <input
                            id='bearer'
                            type='text'
                            className="form-control form-control-md"
                            placeholder='Recieving Account...'
                            required
                            ref={(input) => { this.bearer = input}}
                          />
                      </div>
                      <div>
                        <br></br>
                          <input
                            id='reviewer'
                            type='text'
                            className="form-control form-control-md"
                            placeholder='Reviewing Account...'
                            required
                            ref={(input) => { this.reviewer = input}}
                          />
                      </div>
                      <div>
                        <br></br>
                          <input
                            id='expiry'
                            type='number'
                            className="form-control form-control-md"
                            placeholder='To Expire In...'
                            required
                            ref={(input) => { this.expiry = input}}
                          />
                      </div>
                      <div>
                        <br></br>
                          <input
                            id='amount'
                            type='number'
                            className="form-control form-control-md"
                            placeholder='Amount...'
                            required
                            ref={(input) => { this.amount = input}}
                          />
                      </div>
                      <div className='form-group mt-5'>
                        <button type='submit' className='btn btn-primary'>Sign Cheque</button>
                      </div>
                    </form>
                  </div>
                </Tab>
                <Tab eventKey="cash" title="Cash">  
                  <div>
                    <br></br>
                    Your Cheques
                    <br></br>
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      let chequeID = this.chequeID.value
                      this.state.dcheque.cashCheque(chequeID)
                    }}>
                      <div className='form-group mr-sm-2'>
                      <br></br>
                        <input
                          id='depositAmount'
                          step="1"
                          type='number'
                          className="form-control form-control-md"
                          placeholder='Cheque Identifier'
                          required
                          ref={(input) => { this.chequeID = input}}
                        />
                      </div>
                      <button type='submit' className='btn btn-primary'>Cash Cheque</button>
                    </form>
                  </div>
                </Tab>
                <Tab eventKey="acceptedUsers" title="AcceptedUsers">
                  <br></br>
                  You are a(n) __ accepting cheques from...
                  <br></br>
                  <br></br>
                  <Form onSubmit={(e) => {
                    e.preventDefault()
                    let acceptedAddress = this.acceptedAddress.value
                    if (this.userType2.checked){  // merchant accepts this auditor
                      this.state.dcheque.setAcceptedAuditor(acceptedAddress)
                    } else{  // auditor accepts this user
                      this.state.dcheque.setAcceptedDrawers(acceptedAddress)
                      this.state.dcheque.setAllowedDuration(60*60*24*7)
                    }
                    }}>
                    <div key={`inline-${'radio'}`} className="mb-3">
                        <Form.Check ref={(input) => { this.userType2 = input}}
                          defaultChecked={true}
                          inline
                          label="Merchant"
                          value='1'
                          name="group1"
                          type={'radio'}
                          id={`inline-${'radio'}-2`}
                        />
                        <Form.Check ref={(input) => { this.userType3 = input}}
                          inline
                          label="Auditor"
                          value='2'
                          name="group1"
                          type={'radio'}
                          id={`inline-${'radio'}-3`}
                        />
                      </div>
                      <input
                          id='acceptedAddress'
                          type='text'
                          className="form-control form-control-md mt-2"
                          placeholder='Address...'
                          required
                          ref={(input) => { this.acceptedAddress = input}}
                        />
                        <div>
                          <button type='submit' className='btn btn-primary mt-3'>Add Address</button>
                        </div>
                  </Form>
                </Tab>
              </Tabs>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;