const AWS = require('aws-sdk');
const {nanoid} = require('nanoid');



const dynamoClient = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = 'HRPortal';

module.exports.addUser = async(profile) => {

    let user = {...profile,status:"Pending"};
    console.log(user);
    const params = {
        TableName : TABLE_NAME,
        Item : user
    };

    return await dynamoClient.put(params).promise();
    console.log('User Added Successfully')
}

module.exports.fetchLeaveStatus = async(id) => {
    const params = {
        TableName : TABLE_NAME,
        Key : {
            id
        }
    }
    dynamoClient.get(params, function(err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
        }
    });
}



