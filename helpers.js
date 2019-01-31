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
	}
};