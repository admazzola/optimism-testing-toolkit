 const fs = require('fs')
 const path = require('path')
 const Web3 = require('web3')
 const expect = require('chai').expect 
 
 const TestHelper = require('./test-helper')
 

let testAccountA = {
  publicAddress: '0x95eDA452256C1190947f9ba1fD19422f0120858a',
  secretKey: "0x31c354f57fc542eba2c56699286723e94f7bd02a4891a0a7f68566c2a2df6795",
  balance: "1000000000000000000000000000000000"

}

let testAccountB = {
  publicAddress: '0x4df25e870fC979ff3FE46F5329021A074504698a',
  secretKey: "0x35e642e9de5a47e3ccb2a118a2b37fdd418037df6aea453b9f9f40790878b5a5",
  balance: "1000000000000000000000000000000000"

}


const ganacheOptions = { gasLimit: 8000000, accounts:[testAccountA,testAccountB] };

const provider = ganache.provider( ganacheOptions )
const OPTIONS = {
  defaultBlock: "latest",
  transactionConfirmationBlocks: 1,
  transactionBlockTimeout: 5 
};

 
 
const web3 = new Web3(provider, null, OPTIONS);
 

let tokenContractJSON = fs.readFileSync(path.join('generated/built/MintableToken.json'));
let tokenContractData = JSON.parse(tokenContractJSON)


let guildContractJSON = fs.readFileSync(path.join('generated/built/MinersGuild.json'));
let guildContractData = JSON.parse(guildContractJSON)
 
let primaryAccountAddress = testAccountA.publicAddress
 
let secondaryAccountAddress = testAccountB.publicAddress


var contractInstances  = {} 

describe("EIP712 Contract Testing", function() {
    it("deploys contract", async function() {
 
     
     // let primaryAccountAddress = testAccount.publicAddress


     contractInstances['stakeabletoken'] = await TestHelper.deployContract(tokenContractData ,primaryAccountAddress, web3, [8])
     contractInstances['reservetoken'] = await TestHelper.deployContract(tokenContractData ,primaryAccountAddress, web3, [8])

     contractInstances['guild'] = await TestHelper.deployContract(guildContractData ,primaryAccountAddress, web3, [contractInstances['stakeabletoken'].options.address, contractInstances['reservetoken'].options.address])

     
   
      //console.log("deployed contract at ", contractInstances['guild'].options.address)
      expect( contractInstances['guild'].options.address ).to.exist;
    });

    it("calls methods ", async function() {



      await contractInstances['reservetoken'].methods.transferOwnership(contractInstances['guild'].options.address).send({from: primaryAccountAddress})
      
      let newOwner = await contractInstances['reservetoken'].methods.owner().call()
      expect( newOwner ).to.equal( contractInstances['guild'].options.address );
 
      await contractInstances['stakeabletoken'].methods.mint(primaryAccountAddress, 9000).send({from: primaryAccountAddress})
      await contractInstances['stakeabletoken'].methods.mint(secondaryAccountAddress, 9000).send({from: primaryAccountAddress})
      
      let myBalance = await TestHelper.getERC20Balance( contractInstances['stakeabletoken'] , primaryAccountAddress   )
      expect( parseInt(myBalance) ).to.equal( 9000 );


      await contractInstances['stakeabletoken'].methods.approveAndCall(contractInstances['guild'].options.address, 1000, '0x0').send({from: secondaryAccountAddress,  gasLimit: 8000000 })



    //  await contractInstances['stakeabletoken'].methods.transfer(contractInstances['guild'].options.address, 1000).send({from: primaryAccountAddress})
     

      await contractInstances['stakeabletoken'].methods.approveAndCall(contractInstances['guild'].options.address, 1000, '0x0').send({from: primaryAccountAddress,  gasLimit: 8000000 })

      myBalance = await TestHelper.getERC20Balance( contractInstances['stakeabletoken'] , primaryAccountAddress   )
       expect( parseInt(myBalance) ).to.equal( 8000 );


      let myReserve = await TestHelper.getERC20Balance( contractInstances['reservetoken'] , primaryAccountAddress   )
       expect( parseInt(myReserve) ).to.equal( 1000 );

 
 
       await contractInstances['stakeabletoken'].methods.approveAndCall(contractInstances['guild'].options.address, 1000, '0x0').send({from: primaryAccountAddress,  gasLimit: 8000000 })
       myReserve = await TestHelper.getERC20Balance( contractInstances['reservetoken'] , primaryAccountAddress   )
       expect( parseInt(myReserve) ).to.equal( 2000 );
 
  
       
      let reserveMinted =  await contractInstances['guild'].methods._reserveTokensMinted(500).call()
      expect( parseInt( reserveMinted ) ).to.equal(  499 );

      let outputAmount =  await contractInstances['guild'].methods._vaultOutputAmount(499, contractInstances['stakeabletoken'].options.address ).call()
      expect( parseInt( outputAmount ) ).to.equal(  498 );

 

       myBalance = await TestHelper.getERC20Balance( contractInstances['stakeabletoken'] , primaryAccountAddress   )
       expect( parseInt(myBalance) ).to.equal( 7000 );

       await contractInstances['guild'].methods.unstakeCurrency(100, contractInstances['stakeabletoken'].options.address).send({from: primaryAccountAddress,  gasLimit: 8000000 })
       myBalance = await TestHelper.getERC20Balance( contractInstances['stakeabletoken'] , primaryAccountAddress   )
       expect( parseInt(myBalance) ).to.equal( 7099 );


       await contractInstances['stakeabletoken'].methods.transfer(contractInstances['guild'].options.address, 1000).send({from: secondaryAccountAddress})
     
       outputAmount =  await contractInstances['guild'].methods._vaultOutputAmount(499, contractInstances['stakeabletoken'].options.address).call()
       expect( parseInt( outputAmount ) ).to.equal(  671  );


       //test in and out after donation 
 
       await contractInstances['stakeabletoken'].methods.approveAndCall(contractInstances['guild'].options.address, 1000, '0x0').send({from: primaryAccountAddress,  gasLimit: 8000000 })
       myReserve = await TestHelper.getERC20Balance( contractInstances['reservetoken'] , primaryAccountAddress   )
       expect( parseInt(myReserve) ).to.equal( 2643 );

         outputAmount =  await contractInstances['guild'].methods._vaultOutputAmount(743, contractInstances['stakeabletoken'].options.address).call()
       expect( parseInt( outputAmount ) ).to.equal(  999 );
 
      // await contractInstances['guild'].methods.reserveTokensMinted(contractInstances['guild'].options.address, 1000, '0x0').send({from: primaryAccountAddress,  gasLimit: 8000000 })

     
    });
 

    /*
    This is what you would do in your frontend to make metamask pop up 
    This would output the signature value 


     let signResult = await  EIP712Helper.signTypedData( web3, from, JSON.stringify(typedDatahash)  )
         
  
     For this test only, the signature will be calculated from the pkey
    */


/*
   
    var privateKey = testAccount.secretKey;
    var privKey = Buffer.from(privateKey.substring(2), 'hex')
 
     


    const sig = ethUtil.ecsign( typedDatahash   , privKey );
 
    var signature = ethUtil.toRpcSig(sig.v, sig.r, sig.s);
    


    let recoveredSigner = EIP712Utils.recoverPacketSigner(typedData, signature)
    console.log('recoveredSigner', recoveredSigner )
      

      let args = Object.values(dataValues)
      args.push(signature)

      console.log('args', args )

      let result = await myEIP712Contract.methods.verifyOffchainSignatureAndDoStuff(...args).send({from:  primaryAccountAddress })

      console.log("result of method call: ", result)
    });*/
  });