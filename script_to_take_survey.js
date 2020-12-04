const request = require('request')
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://10.0.4.5:27017/mindmatch_scikey";

async function main () {
    const client = await MongoClient.connect(url, {
        useNewUrlParser: true,
        authSource: 'admin',
        auth: {
            user: 'dbuser',
            password: 'passw0rd1'
        }
    });
    const db = await client.db();
    let userCode = 103
    const survey_campaign_data = await getSurveyCampaignData(db, userCode)
    console.log("-----------");
    console.log(survey_campaign_data);
    const surveyCampaignTrackerId = survey_campaign_data[0].survey_campaign_tracker_id
    const surveyRecipientDetailsId = survey_campaign_data[0].survey_recipient_details_id
    const surveyResponseAPIResponse = await surveyResponseAPICall(userCode, surveyCampaignTrackerId, surveyRecipientDetailsId)
}

main();

async function getSurveyCampaignData(db, userCode) {
    const user_code = userCode.toString()
    const collection = db.collection('survey_campaign_tracker')
    const queryResponse = collection.find({"target_entity.id":user_code,"survey_id" : 436}).toArray()
    return queryResponse
}

async function surveyResponseAPICall(userCode, surveyCampaignTrackerId, surveyRecipientDetailsId) {
    const user_code = userCode.toString()
    let url = 'http://10.0.4.4:8082/steerhigh/v3/saveSurveyResponse/436'
    let options = {
        method: 'POST',
        url: url,
        qs: {
            domain_name: 'scikey'
        },
        headers: {
            orgname: 'qa-mindmatch',
            user_code: userCode,
            token: 'cd53fa2142e2c4c6c9a4f2f8abb32fc943d7b410a829eb7da082df663896b37b0693ddb0ecdb334c24998a46779f6351143993f3b80a539221eaa7d7da5edc0c4e1e9d336e3e135f95edd964f37c009b'
        },
        body: await generateBodyForSurveyResponseApi(surveyRecipientDetailsId),
        json: true
    }
    await request(options, async function (error, response) {
        if (error) {
            throw error
        } else {
            console.log('--- SURVEY RESPONSE DONE --------');
            await updateSurveyStatusAPICall(userCode, surveyCampaignTrackerId, surveyRecipientDetailsId)
            return response
        }
    })
}

async function generateBodyForSurveyResponseApi(surveyRecipientDetailsId) {
    const json = {}
    json['completed_page_number'] = 4,
    json['progress_status'] = 'COMPLETED',
    json['survey_responses_json'] = "{\"question1\":\"item2\",\"question2\":\"item3\",\"question3\":\"item3\",\"question4\":\"item5\",\"question5\":\"item5\",\"question6\":\"item6\",\"question7\":\"item5\",\"question9\":\"item6\",\"question8\":\"item5\",\"question10\":\"item5\",\"question11\":\"item6\",\"question12\":\"item8\",\"question13\":\"item5\",\"question14\":\"item8\",\"question15\":\"item7\",\"question16\":\"item3\",\"question17\":\"item6\",\"question18\":\"item7\",\"question19\":\"item10\",\"question20\":\"item6\",\"question21\":\"item5\",\"question22\":\"item5\",\"question23\":\"item4\",\"question24\":\"item8\",\"question25\":\"item9\"}",
    json['survey_recipient_details_id'] = surveyRecipientDetailsId
    json['created_by'] = surveyRecipientDetailsId
    json['updated_by'] = surveyRecipientDetailsId
    const additionalDetails = []
    const json1 = {}
    json1['attribute_name'] = 'SUBMITTED_ON',
    json1['attribute_value'] = "2020-11-25 10:54:50 AM"
    const json2 = {}
    json2['attribute_name'] = 'CHANNEL',
    json2['attribute_value'] = "Windows"
    const json3 = {}
    json3['attribute_name'] = 'BROWSER',
    json3['attribute_value'] = "Chrome"
    const json4 = {}
    json4['attribute_name'] = 'REQUEST_ID',
    json4['attribute_value'] = "50473"
    additionalDetails.push(json1)
    additionalDetails.push(json2)
    additionalDetails.push(json3)
    additionalDetails.push(json4)
    json['response_additional_details'] = additionalDetails
    return json
}

async function updateSurveyStatusAPICall(userCode, surveyCampaignTrackerId, surveyRecipientDetailsId) {
    try {
        const user_code = userCode.toString()
    const survey_campaign = surveyCampaignTrackerId.toString()
    let url = 'http://10.0.4.4:8113/api/v2/candidate/user/' + user_code + '/updateSurveyCampaignTracker/' + survey_campaign
    let options = {
        method: 'POST',
        url: url,
        qs: {
            domain_name: 'scikey'
        },
        headers: {
            orgname: 'qa-mindmatch',
            user_code: userCode,
            token: 'cd53fa2142e2c4c6c9a4f2f8abb32fc943d7b410a829eb7da082df663896b37b0693ddb0ecdb334c24998a46779f6351143993f3b80a539221eaa7d7da5edc0c4e1e9d336e3e135f95edd964f37c009b'
        },
        body: { status: 1 },
        json: true
    }
    await request(options, async function (error, response) {
        try {
            console.log('--- UPDATE STATUS DONE --------');
            await insertScoreAPICall(userCode, surveyRecipientDetailsId)
            return response
        } catch (error) {
            throw error
        }
    })
    } catch (error) {
        throw error
    }
}

async function insertScoreAPICall(userCode, surveyRecipientDetailsId) {
    const survey_recipient = surveyRecipientDetailsId.toString()
    let url = 'http://10.0.4.4:8087/sthi/score/v1/selfPerception/' + survey_recipient
    let options = {
        method: 'GET',
        url: url,
        qs: {
            domain_name: 'scikey'
        },
        headers: {
            orgname: 'qa-mindmatch',
            user_code: userCode,
            token: 'cd53fa2142e2c4c6c9a4f2f8abb32fc943d7b410a829eb7da082df663896b37b0693ddb0ecdb334c24998a46779f6351143993f3b80a539221eaa7d7da5edc0c4e1e9d336e3e135f95edd964f37c009b'
        },
        json: true
    }
    await request(options, function (error, response) {
        if (error) {
            throw error
        } else {
            console.log('--- SCORE INSERTED SUCCESSFULLY --------');
            return response
        }
    })
}