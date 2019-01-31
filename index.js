const _ = require('lodash');
const SsmlBuilder = require('ssml-builder');
const { SkillBuilders, DynamoDbPersistenceAdapter, DefaultApiClient } = require('ask-sdk');

const Helpers = require('./helpers');

const PersistenceAdapter = new DynamoDbPersistenceAdapter({
	tableName: process.env.AWS_DYNAMODB_TABLE,
	createTable: true
});

const AlexaApiClient = new DefaultApiClient();

const SkillBuilder = SkillBuilders.custom();

/**
 * LAUNCH REQUEST handler
 * 
 */
const LaunchRequestHandler = {
	canHandle(handlerInput) {
		return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
	},
	async handle(handlerInput) {
		let speech = new SsmlBuilder();
		
		speech.say("Welcome to wanderlust! Everybody loves to travel, I'm sure you do too.")
					.say("I can help you record your wanderlust moments. Just say, I want to travel, to get started.")
					.say("You can also say, tell my travel plans, to get details about your trips")
					.pause("500ms")
					.say("What would you like to do ?")

    return handlerInput.responseBuilder
			.speak(speech.ssml(true))
			.withShouldEndSession(false)
      .getResponse();
  }
}

/**
 * TRAVEL INTENT handler
 */
const TravelIntentHandler = {
	canHandle(handlerInput) {
		return handlerInput.requestEnvelope.request.type === 'IntentRequest' 
		&& handlerInput.requestEnvelope.request.intent.name === 'TravelIntent';
	},
	async handle(handlerInput) {
    let speech        = new SsmlBuilder();
    let intentRequest = _.get(handlerInput, 'requestEnvelope.request');
		let updatedIntent = _.get(intentRequest, 'intent');
		
		if (intentRequest.dialogState != "COMPLETED") {
			//send dialog directive, if intent request is not complete

			return handlerInput.responseBuilder
						.addDelegateDirective(updatedIntent)
						.getResponse();
		} else {

			//check for intent confirmation
			if (updatedIntent.confirmationStatus != "DENIED") {
				//confirmed, do this
				
				//get persistent attributes
				let pAttributes = await Helpers.getPersistentAttributes(handlerInput);
				let trips = _.get(pAttributes, 'trips', []);

				//get slot values
				const destination = _.get(updatedIntent, 'slots.destination.value');
				const month       = _.get(updatedIntent, 'slots.month.value');

				//push to existing trips
				trips.push({ destination, month });
				_.set(pAttributes, 'trips', trips);

				//save to db
				await Helpers.setPersistentAttributes(handlerInput, pAttributes);

				speech.say(`Ok. I've saved your interest to visit ${destination} in the month of ${month}`);
			} else {
				//denied, do this

				speech.say(`Ok. But do remember, Life is short, but world is wide.`);
			}

			return handlerInput.responseBuilder
				.speak(speech.ssml(true))
				.getResponse();
		}
  }
};

/**
 * LIST INTENT handler
 */
const ListIntentHandler = {
	canHandle(handlerInput) {
		return handlerInput.requestEnvelope.request.type === 'IntentRequest' 
		&& handlerInput.requestEnvelope.request.intent.name === 'ListIntent';
	},
	async handle(handlerInput) {
		let speech = new SsmlBuilder();
		
		//trigger progressive response
		const progressiveResponse = Helpers.callProgressiveResponse(handlerInput, "Please wait... while I fetch your details.");

		//get persistent attributes
		let pAttributes = await Helpers.getPersistentAttributes(handlerInput);
		let trips = _.get(pAttributes, 'trips', []);

		let cardText = "";

		if (_.isEmpty(trips)) {
			speech.say("You don't have any travel plans. Seems like wanderlust has not striked you yet.");

			cardText += "You don't have any travel plans"; 
		} else {
			speech.say("Here are the details of trips planned so far.");

			_.forEach(trips, (trip) => {
				const {destination, month} = trip;

				speech.say(`${destination} in ${month},`);

				cardText += `${destination} (${month}) \n`;
			});

			speech.pause('500ms');

			if (_.size(trips) > 3) {
				speech.say("Pack your bags, and get ready with your passport. You have got lot to travel");
			} else {
				speech.say("Don't count the days, make the days count. Let's add few more places to your wander list");
			}
		}

		//await progressive response before response
		await progressiveResponse;

		return handlerInput.responseBuilder
				.speak(speech.ssml(true))
				.withSimpleCard('Your WanderLIST', cardText)
				.getResponse();
	}
};

/**
 * FALLBACK handler
 * 
 */
const FallbackIntentHandler = {
	canHandle(handlerInput) {
	  return handlerInput.requestEnvelope.request.type === 'IntentRequest'
		  && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.FallbackIntent';
	},
	handle(handlerInput, error) {
		return handlerInput.responseBuilder
			.speak("Sorry! I can't understand the command")
			.getResponse();
	}
};

/**
 * SESSION END request handler
 * 
 */
const SessionEndedRequestHandler = {
	canHandle(handlerInput) {
	  return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
	},
	handle(handlerInput) {
		//session cleanup

	  return handlerInput.responseBuilder.getResponse();
	}
};

/**
 * ERROR handler
 * 
 */
const ErrorHandler = {
	canHandle() {
	  return true;
	},
	handle(handlerInput, error) {
		let errorMessage = error.message;

	  console.log("------- ERROR HANDLER -------");
	  console.log(`ERROR: ${errorMessage}`);
		console.log("------- ERROR HANDLER -------");

    return handlerInput.responseBuilder
      .speak('Oops! There seems to be some error. Please try again later.')
      .getResponse();
	},
};

/**
 * Request Interceptor
 * 
 */
const RequestInterceptor = {
	process(handlerInput) {
		const request = _.get(handlerInput, 'requestEnvelope.request');
		const intent  = _.get(request, 'intent');

		console.log(`----------- ${request.type} : ${(intent) ? intent.name : "NA"} -----------`);
		
		console.log('Skill Request');
		console.log(request);

		console.log('Intent Slots');
		console.log(_.get(intent, 'slots'));
	}
};

/**
 * Response Interceptor
 * 
 */
const ResponseInterceptor = {
	process(handlerInput, response) {
		const request = _.get(handlerInput, 'requestEnvelope.request');
		const intent  = _.get(request, 'intent');
		
		console.log('Skill Response');
		console.log(response);

		console.log(`----------- ${request.type} : ${(intent) ? intent.name : "NA"} -----------`);
	}
};

module.exports.handler = SkillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
		TravelIntentHandler,
		ListIntentHandler,
    FallbackIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .addRequestInterceptors(RequestInterceptor)
	.addResponseInterceptors(ResponseInterceptor)
	.withPersistenceAdapter(PersistenceAdapter)
	.withApiClient(AlexaApiClient)
  .withSkillId(process.env.ALEXA_SKILL_ID)
  .lambda();
