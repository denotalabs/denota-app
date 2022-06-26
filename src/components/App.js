import { Tabs, Tab } from 'react-bootstrap'
import dCheque from '../abis/dCheque.json'
import React, { Component } from 'react';
import dcheque from '../dcheque.png';
import Web3 from 'web3';
import './App.css';


class App extends Component {

  async componentWillMount() {
    await this.loadBlockchainData(this.props.dispatch)
  }

  async loadBlockchainData(dispatch) {
    if(typeof window.ethereum !== 'undefined'){
      // Assign to values to variables: web3, netId, accounts
      const web3 = new Web3(window.ethereum)
      let netId = await web3.eth.net.getId()//; netId = parseInt(netId);
      const accounts = await web3.eth.getAccounts()
      

      if (typeof accounts[0]!=='undefined'){ //check if account is detected, then load balance&setStates, else push alert
        const balance = await web3.eth.getBalance(accounts[0])
        this.setState({account: accounts[0], balance: balance, web3: web3})
      }else{
        window.alert('Please sign in with MetaMask')
      }
      
      try { // Load contracts
        const dChequeAddress = await dCheque.networks[netId].address; console.log(dChequeAddress)
        const dcheque = new web3.eth.Contract(dCheque.abi, dChequeAddress)
        window.dCheque = dcheque
        const dChequeBalance = await web3.eth.getBalance(dChequeAddress); console.log(dChequeBalance)
        // let userBalance = await dcheque.methods.deposits(accounts[0]).call()
        this.setState({dcheque: dcheque, dChequeAddress: dChequeAddress,
          dChequeBalance: web3.utils.fromWei(dChequeBalance), 
          // userBalance:web3.utils.fromWei(userBalance)
        }) 

      } catch (e){
        console.log('error', e)
        window.alert('Contracts not deployed to the current network')
      }
    } else{  //if MetaMask not exists push alert
      window.alert('Please install MetaMask')
    }
  }

  async deposit(amount) {
    if (this.state.dcheque !== 'undefined') { 
      const w3 = this.state.web3
      try{
        w3.eth.sendTransaction({from: this.state.account, to: this.state.dChequeAddress, 
                                value: w3.utils.toHex(amount)})
      } catch (e){
        console.log('Error, deposit: ', e)
      }
    }
  }
  async writeCheque(amount, duration, reviewer, bearer) {
    if(this.state.dcheque !=='undefined'){  // check if this.state.dcheque is ok
      try{ 
        await this.state.dcheque.methods.writeCheque(amount, duration, reviewer, bearer).call()
      } catch(e) {
        console.log('Error, withdraw: ', e)
      }
    }
  }
  async cashCheque(chequeID) {
    if (this.state.dcheque !== 'undefined') {  
      try{
        await this.state.dcheque.methods.cashCheque(chequeID).call()
      } catch (e){
        console.log('Error, deposit: ', e)
      }
    }
  }
  constructor(props) {
    super(props)
    this.state = {
      web3: 'undefined',
      account: '',
      dcheque: null,
      balance: 0,
      dChequeAddress: null,
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
        </nav>
        <div className="container-fluid mt-5 text-center">
        <br></br>
          <h1>Welcome to dCheque</h1>
          <h6>Total deposited: {this.state.dChequeBalance} ETH</h6>
          <h6>Account balance: {this.state.userBalance} ETH</h6>
          
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
                      amount = Web3.utils.toWei(amount) //convert to wei
                      this.deposit(amount)
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
                      let amount = this.depositAmount.value
                      amount = Web3.utils.toWei(amount) //convert to wei
                      let [duration, reviewer, bearer] = [this.duration.value, this.reviewer.value, this.bearer.value]
                      this.writeCheque(amount, duration, reviewer, bearer)
                    }}>
                      <div className='form-group mr-sm-2'>
                        <br></br>
                          <input
                            // address bearer
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
                            // address reviewer;
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
                            // uint256 expiry;
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
                            // uint256 amount;
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
                {/* TODO add iteration over cheques in the user's possesion */}
                <Tab eventKey="cash" title="Cash">  
                  <div>
                    <br></br>
                    Your Cheques
                    <br></br>
                    {/* <form onSubmit={(e) => {
                      e.preventDefault()
                      let chequeID = this.chequeID.value
                      this.cashCheque(chequeID)
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
                          ref={(input) => { this.chequeID = input}}
                        />
                      </div>
                      <button type='submit' className='btn btn-primary'>Deposit</button>
                    </form> */}
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