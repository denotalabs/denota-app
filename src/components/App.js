import { Tabs, Tab } from 'react-bootstrap'
import dCheque from '../abis/dCheque.json'
import React, { Component } from 'react';
import dcheque from '../dcheque.png';
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
        <img src={dcheque} className="App-logo" alt="logo" height="32"/>
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
                    Write your cheque
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      let amount = this.amount.value; 
                      amount = ethers.utils.formatEther(amount) // convert to wei
                      let [duration, auditor, bearer] = [this.duration.value, this.reviewer.value, this.bearer.value]
                      this.state.dcheque.writeCheque(amount, duration, auditor, bearer)
                    }}>
                      <div className='form-group mr-sm-2'>
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
                      <div className='form-group mr-sm-2'>
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
                      <div className='form-group mr-sm-2'>
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
                      <div className='form-group mr-sm-2'>
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
                      <div>
                        <button type='submit' className='btn btn-primary'>Sign</button>
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
                          step="0.01"
                          type='number'
                          className="form-control form-control-md"
                          placeholder='Cheque Identifier'
                          required
                          ref={(input) => { this.chequeID = input}}
                        />
                      </div>
                      <button type='submit' className='btn btn-primary'>Deposit</button>
                    </form>
                  </div>
                </Tab>
                <Tab eventKey="auditors" title="Auditors">
                  <br></br>
                    Reviewers
                    <br></br>
                    <br></br>
                  <div>
                    <button type='submit' className='btn btn-primary' onClick={(e) => this.setReviewer(e)}>Update</button>
                  </div>
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