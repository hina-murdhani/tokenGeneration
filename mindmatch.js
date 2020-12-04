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
    let userCode = 100
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
    const queryResponse = collection.find({"target_entity.id":user_code,"survey_id" : 1}).toArray()
    return queryResponse
}

async function surveyResponseAPICall(userCode, surveyCampaignTrackerId, surveyRecipientDetailsId) {
    const user_code = userCode.toString()
    let url = 'http://10.0.4.4:8082/steerhigh/v3/saveSurveyResponse/1'
    let options = {
        method: 'POST',
        url: url,
        qs: {
            domain_name: 'scikey'
        },
        headers: {
            orgname: 'qa-mindmatch',
            user_code: userCode,
            token: 'cd53fa2142e2c4c6c9a4f2f8abb32fc99cbc2f9fec5f8df45a4c412be776e3df378464dc8b0dca72031260c150a27d365a5cdb9605b3ddc057bcb3170e35348f9ef9e60cc2551431c6bf6432f614b910'
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
    json['completed_page_number'] = 27,
    json['progress_status'] = 'IN_DRAFT',
    json['survey_responses_json'] = "{\"question40\":\"item4\",\"question41\":[\"item4\",\"item1\",\"item3\",\"item2\"],\"question22\":true,\"question44\":[\"item1\",\"item4\",\"item2\",\"item3\"],\"question23\":\"5\",\"question45\":[\"item1\",\"item2\",\"item3\",\"item4\"],\"question20\":true,\"question42\":[\"item3\",\"item1\",\"item2\",\"item4\"],\"question21\":\"2\",\"question43\":[\"item2\",\"item3\",\"item4\",\"item1\"],\"question3\":[\"item12\",\"item7\",\"item11\",\"item13\"],\"question48\":[\"item4\",\"item2\",\"item3\",\"item1\"],\"question2\":\"item5\",\"question49\":[\"item1\",\"item2\",\"item4\",\"item3\"],\"question46\":[\"item4\",\"item2\",\"item3\",\"item1\"],\"question47\":[\"item4\",\"item1\",\"item3\",\"item2\"],\"question1\":\"item3\",\"question115\":\"item3\",\"question51\":[\"item2\",\"item4\",\"item3\",\"item1\"],\"question30\":\"item4\",\"question52\":[\"item4\",\"item2\",\"item1\",\"item3\"],\"question50\":[\"item3\",\"item1\",\"item4\",\"item2\"],\"question33\":\"item5\",\"question34\":\"item3\",\"question31\":\"item1\",\"question10\":\"item4\",\"question32\":\"item2\",\"question15\":\"item3\",\"question37\":\"item2\",\"question16\":\"item2\",\"question38\":\"item1\",\"question35\":\"item2\",\"question14\":\"item2\",\"question36\":\"item1\",\"question19\":\"1\",\"question39\":\"item3\",\"question18\":true}",
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
            token: 'cd53fa2142e2c4c6c9a4f2f8abb32fc99cbc2f9fec5f8df45a4c412be776e3df378464dc8b0dca72031260c150a27d365a5cdb9605b3ddc057bcb3170e35348f9ef9e60cc2551431c6bf6432f614b910'
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
            token: 'cd53fa2142e2c4c6c9a4f2f8abb32fc99cbc2f9fec5f8df45a4c412be776e3df378464dc8b0dca72031260c150a27d365a5cdb9605b3ddc057bcb3170e35348f9ef9e60cc2551431c6bf6432f614b910'
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