const SsmlBuilder = require('ssml-builder');
const { SkillBuilders } = require('ask-sdk');

const SkillBuilder = SkillBuilders.custom();

module.exports.handler = SkillBuilder.withSkillId(process.env.ALEXA_SKILL_ID).lambda();
