const {
    ComponentDialog,
    WaterfallDialog
} = require('botbuilder-dialogs');
const {leaveStatusDialog} = require('../constants');

const leaveStatusDialogWaterfall1 = 'leaveStatusDialogWaterfall1'

class LeaveStatus extends ComponentDialog{
    constructor(conversationState){
        super(leaveStatusDialog);

        if(!conversationState) throw new Error('Convesation State is not found');
        this.conversationState = conversationState;

        this.addDialog(new WaterfallDialog(leaveStatusDialogWaterfall1,[
            this.step1.bind(this)
        ]))

        this.initialDialogId = leaveStatusDialogWaterfall1
    }

    async step1(stepContext){
        await stepContext.context.sendActivity('Inside Leave Status');
        return await stepContext.endDialog();
    }
}

module.exports.LeaveStatus = LeaveStatus;
