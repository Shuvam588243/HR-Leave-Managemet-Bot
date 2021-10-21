const {
    ComponentDialog,
    WaterfallDialog,
    DialogSet,
    DialogTurnStatus
} = require('botbuilder-dialogs');
const { LuisRecognizer } = require('botbuilder-ai');


//Dialogs
const { HelpDialog, ApplyLeaveDialog, LeaveStatusDialog } = require('./')



//Constants
const {rootDialog} = require('../constants');
const {helpDialog} = require('../constants');
const {applyLeaveDialog} = require('../constants')
const {leaveStatusDialog} = require('../constants');
const rootDialogWaterfall1 = 'rootDialogWaterfall1'

const luisConfig = {
    applicationId : 'c2c209d2-1c08-497b-9313-afc137ad16bd',
    endpointKey : '56a94745a1bf4cfbb01fbdb106053a33',
    endpint : 'https://luisbottraining.cognitiveservices.azure.com/'
}

class RootDialog extends ComponentDialog{
    constructor(conversationState){
        super(rootDialog);

        if(!conversationState) throw new Error('Conversation State is not found');
        this.conversationState = conversationState;

        this.addDialog(new WaterfallDialog(rootDialogWaterfall1,[
            this.routeMessages.bind(this)
        ]))

        this.recognizer = new LuisRecognizer(luisConfig, {
            apiVersion : 'v3'
        })

        this.addDialog(new HelpDialog(conversationState));
        this.addDialog(new ApplyLeaveDialog(conversationState));
        this.addDialog(new LeaveStatusDialog(conversationState));

        this.initialDialogId = rootDialogWaterfall1
    }

    async routeMessages(stepContext){
    console.log('stepContext.context.activity.activity => ', stepContext.context.activity);
    if(stepContext.context.activity.value && stepContext.context.activity.value.actionType){
        switch(stepContext.context.activity.value.actionType){
            case 'applyLeaveApplicationAction':
                let formvalues = stepContext.context.activity.value;
                delete stepContext.context.activity.value;
                return await stepContext.beginDialog(applyLeaveDialog,{
                    formRefill:true,
                    values:formvalues
                })
        }
    }
    else{
        // let luisresponse = await this.recognizer.recognize(stepContext.context);
        // console.log('Luis Response => ', luisresponse);
        // let luisIntent = luisresponse.luisResult.prediction.topIntent;
        // console.log(luisIntent);
        switch(stepContext.context.activity.text.toLowerCase()){
            case 'apply leave' : 
            return await stepContext.beginDialog(applyLeaveDialog);

            case 'leave status' : 
            return await stepContext.beginDialog(leaveStatusDialog);

            case 'help' : 
            return await stepContext.beginDialog(helpDialog);

            default : context.sendActivity('Sorry, I am still learning can you please refresh your query')
        } 
    }


        return await stepContext.endDialog();

    }

    async run(context, accessor){
        try{
            const dialogSet = new DialogSet(accessor);
            dialogSet.add(this);
            const dialogContext = await dialogSet.createContext(context);
            const results = await dialogContext.continueDialog();
            if(results && results.status === DialogTurnStatus.empty){
                await dialogContext.beginDialog(this.id);
            }else{
                console.log('Dialog Stack is Empty')
            }
        }catch(error){
            console.log(error);
        }
    }
}

module.exports.RootDialog = RootDialog;