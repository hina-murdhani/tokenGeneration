const { text } = require('express');
const express = require('express')
var aesjs = require('aes-js');
const app = express()
app.use(express.json())
app.post("/tokengeneratiion", (req, res) => {
    try {
        console.log("welcome");
        const dataObject = {
            userName: req.body.userLogonName,
            password: req.body.password,
            sublocation: req.body.sublocation,
            clientKey: req.body.clientKey,
            clientCode: req.body.clientCode
        }

        let K1, buf, CK , key
        keys = Object.keys(dataObject)
        //generating the text data..........
        textData = ""
        for (i = 0; i < Object.keys(dataObject).length; i++) {

            key = keys[i]

            if (i == 0) {
                textData = textData + "{" + key + "}" + "=" + "{" + dataObject[key] + "}"
            } else {
                textData = textData + "|" + "{" + key + "}" + "=" + "{" + dataObject[key] + "}"
            }
        }
        console.log("-----------textdata",textData);

        Codes = [217, 37, 97, 103, 109, 71, 127, 47, 131, 181, 43, 139, 17, 11, 192, 199]
        IV = [123, 217, 137, 87, 83, 251, 31, 67, 89, 63, 2, 47, 39, 29, 73, 107]

        console.log("---------------IV" , IV);

        
        buf = Buffer.from(dataObject.clientKey, 'ascii');

        K1 = buf.slice(0, 15)

        CK = []

        //generate the cipher key..........
        for (i = 0; i < 16; i++) {
            CK[i] = K1[i] ^ Codes[i]
        }
        console.log("---------------------CK" ,CK);
 
        //AES encryption  
        // key -> CK
        //iv -> iv
        //text -> textData

        //byte conversion of textdata
        var textBytes = aesjs.utils.utf8.toBytes(textData);
        var aesCbc = new aesjs.ModeOfOperation.cbc(CK, IV);
        var encryptedBytes = aesCbc.encrypt(textBytes);

      
        var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
        console.log(encryptedHex);
        res.send(encryptedHex)

    } catch (err) {
        console.log(err);
    }

})

app.listen(8000)