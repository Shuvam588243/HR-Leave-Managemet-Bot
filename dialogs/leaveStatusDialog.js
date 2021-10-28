const {
    ComponentDialog,
    WaterfallDialog,
    TextPrompt
} = require('botbuilder-dialogs');
const {leaveStatusDialog} = require('../constants');
const {fetchLeaveStatus} = require('../DB');

const leaveStatusDialogWaterfall1 = 'leaveStatusDialogWaterfall1'
const TextPromptDialog = 'TextPromptDialog'
const LeaveStatusAccessorData = 'LeaveStatusAccessorData'
let dialogData;
class LeaveStatus extends ComponentDialog{
    constructor(conversationState){
        super(leaveStatusDialog);

        if(!conversationState) throw new Error('Convesation State is not found');
        this.conversationState = conversationState;
        this.LeaveStatusAccessor = this.conversationState.createProperty(
            LeaveStatusAccessorData
          );

        this.addDialog(new TextPrompt(TextPromptDialog));

        this.addDialog(new WaterfallDialog(leaveStatusDialogWaterfall1,[
            this.preprocessLuisEntity.bind(this),
            this.askHRMID.bind(this),
            this.checkLeaveStatus.bind(this)
        ]))

        this.initialDialogId = leaveStatusDialogWaterfall1
    }

    async preprocessLuisEntity(stepContext) {
        try {
          if (stepContext.options && stepContext.options.luisResult) {
            // console.log(stepContext.options.entities);
    
            let HRMEntity = stepContext.options.entities.HRM_id
              ? stepContext.options.entities.HRM_id[0]
              : null;

            // console.log(HRMEntity);
    
            stepContext.values.Entities = {
                HRMEntity
            };

            return stepContext.next();
          }
        } catch (error) {
          console.log(error);
        }
      }

    async askHRMID(stepContext){
        dialogData = this.LeaveStatusAccessor.get(stepContext.context,{});
        if(stepContext.values.Entities.HRMEntity){
            stepContext.next();
        }else{
            return await stepContext.prompt(TextPromptDialog,
                'Please Enter Your HRMID to proceed')
        }
        // await stepContext.context.sendActivity('Inside Leave Status');
        return await stepContext.endDialog();
    }

    async checkLeaveStatus(stepContext){
        dialogData = this.LeaveStatusAccessor.get(stepContext.context);
        if(stepContext.values.Entities.HRMEntity){
            dialogData.HRMID = stepContext.values.Entities.HRMEntity;
        }else{
            dialogData.HRMID = stepContext.result;
        }

        await stepContext.context.sendActivity(`Processing Leave Status of ${dialogData.HRMID}`);
        await fetchLeaveStatus(dialogData.HRMID);
        console.log('done');
        return await stepContext.endDialog();

        console.log(dialogData);
    }
}

module.exports.LeaveStatus = LeaveStatus;
