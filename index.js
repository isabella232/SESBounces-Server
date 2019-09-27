const AWS = require('aws-sdk')
const Promise = require('bluebird')

/**
 * Handles SES bounce notifications via SNS and writes to S3
 */
exports.sesBounceHandler = function(event, context, callback) {
    const s3 = new AWS.S3({
        params: {
            Bucket: process.env.AWS_BUCKET || 'ses-bounce-test'
        }
    })

    let promises = event.Records.map(function(record) {
        console.log('In records loop')
        if (record.Sns) {
            let timestamp = record.Sns.Timestamp
            let messageId = record.Sns.MessageId
            let message = record.Sns.Message
            console.log('Should write to S3')
            return new Promise(function(resolve, reject) {
                s3.putObject({
                    Body: JSON.stringify(JSON.parse(message), null, 2),
                    Key: 'bounce-' + timestamp + '-' + messageId + '.json'
                }, function(err) {
                    if (err) {
                        return reject(err)
                    }
                    console.log('Finish write to S3')
                    resolve()
                })
            })
        }
        console.log('Nothing to write to S3')
        return Promise.resolve()
    })

    console.log('Waiting for all promises')
    Promise.all(promises)
        .then(function() {
            console.log('Finish all')
            callback(null)
        })
        .catch(function(err) {
            console.error(err.stack)
            callback(err)
        })
}