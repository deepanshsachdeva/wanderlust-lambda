const _ = require('lodash');

module.exports = {
	getSessionAttributes: (handlerInput) => {
		return handlerInput.attributesManager.getSessionAttributes();
	},

	setSessionAttributes: (handlerInput, attributes) => {
		handlerInput.attributesManager.setSessionAttributes(attributes);
	},

	getPersistentAttributes: (handlerInput) => {
		return handlerInput.attributesManager.getPersistentAttributes();
	},

	setPersistentAttributes: (handlerInput, attributes) => {
		handlerInput.attributesManager.setPersistentAttributes(attributes);
		return handlerInput.attributesManager.savePersistentAttributes();
	},

	callProgressiveResponse(handlerInput, speechText) {
		const requestEnvelope        = handlerInput.requestEnvelope;
		const directiveServiceClient = handlerInput.serviceClientFactory.getDirectiveServiceClient();
		const requestId              = requestEnvelope.request.requestId;
		const endpoint               = requestEnvelope.context.System.apiEndpoint;
		const token                  = requestEnvelope.context.System.apiAccessToken;

		const directive = {
		  header: {
			requestId,
		  },
		  directive: {
			type: 'VoicePlayer.Speak',
			speech: speechText,
		  },
		};
	  
		return directiveServiceClient.enqueue(directive, endpoint, token);
	},
};