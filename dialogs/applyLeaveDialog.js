const {
    ComponentDialog,
    WaterfallDialog,
    ChoicePrompt,
    ChoiceFactory,
    NumberPrompt,
    TextPrompt,
    Dialog
} = require('botbuilder-dialogs')
const {applyLeaveDialog} = require('../constants');
const {confirmLeave,leaveApplicationForm } = require('../cards/cards');
const { CardFactory } = require('botbuilder-core');



//Constants
const applyLeaveDialogWaterfall1 = 'applyLeaveDialogWaterfall1'
const applyLeaveDialogWaterfall2 = 'applyLeaveDialogWaterfall2'
const ChoicePromptDialog = 'ChoicePromptDialog'
const NumberPromptDialog = 'NumberPromptDialog'
const TextPromptDialog = 'TextPromptDialog'



const applyLeaveDataAccessor = 'applyLeaveDataAccessor'

class ApplyLeave extends ComponentDialog{
    constructor(conversationState){
        super(applyLeaveDialog);

        if(!conversationState) throw new Error('Conversation State is not found');

        this.conversationState = conversationState;
        this.applyLeaveDataAccessor = this.conversationState.createProperty(applyLeaveDataAccessor)

        this.addDialog(new ChoicePrompt(ChoicePromptDialog));
        this.addDialog(new NumberPrompt(NumberPromptDialog));
        this.addDialog(new TextPrompt(TextPromptDialog));

        this.addDialog(new WaterfallDialog(applyLeaveDialogWaterfall1,[
            this.askLeaveType.bind(this),
            this.askNoOfDays.bind(this),
            this.askDateOfLeave.bind(this),
            this.leaveConfirmation.bind(this)
        ]))

        this.addDialog(new WaterfallDialog(applyLeaveDialogWaterfall2,[
            this.showForm.bind(this),
            this.preprocessUserInput.bind(this),
            // this.applyLeaveApplication.bind(this)         
        ]))



        this.initialDialogId = applyLeaveDialogWaterfall2
    }

    async askLeaveType(stepContext){
        return await stepContext.prompt(ChoicePromptDialog,{
            prompt : 'Please help me with the type of leave you want to apply for',
            choices : ChoiceFactory.toChoices([
                'Sick Leave',
                'Casual Leave',
                'Earned Leave'
            ])
        })
    }

    async askNoOfDays(stepContext){
        let dialogState = await this.applyLeaveDataAccessor.get(stepContext.context,{});
        dialogState.leaveType = stepContext.result.value;
        return await stepContext.prompt(NumberPromptDialog,`For How many days you want to apply for ${dialogState.leaveType}`);
    }

    async askDateOfLeave(stepContext){
        let dialogState = await this.applyLeaveDataAccessor.get(stepContext.context);
        dialogState.leaveDays = stepContext.result;
        return await stepContext.prompt(TextPromptDialog,`From which date you want to apply for you ${dialogState.leaveType} leave application of ${dialogState.leaveDays} days?`);
    }

    async leaveConfirmation(stepContext){
        let dialogState = await this.applyLeaveDataAccessor.get(stepContext.context);
        dialogState.leaveDate = stepContext.result;
        await stepContext.context.sendActivity({
            attachments : [
                CardFactory.adaptiveCard(confirmLeave(
                    dialogState.leaveType,
                    dialogState.leaveDays,
                    dialogState.leaveDate
                ))
            ]
        })
        return await stepContext.endDialog();
    }

    //with form
    async showForm(stepContext){
        try{
            await stepContext.context.sendActivity({
                attachments : [
                    CardFactory.adaptiveCard(leaveApplicationForm())
                ]
            })
            return Dialog.EndOfTurn;
        }catch(error){
            console.log(error)
        }
    }
    
    async preprocessUserInput(stepContext){
        try{
            let userInput = stepContext.context.activity.value;
            console.log(userInput);
            let numberOfDays = userInput.leaveDays;
            if(numberOfDays > 3){
                await stepContext.context.sendActivity('Maximum Applicable Leave Days are 3. Please Contact HR in person for futher progress of the application')
            }else{
                await stepContext.context.sendActivity({
                    attachments : [
                        CardFactory.adaptiveCard(confirmLeave(
                            userInput.leaveType,
                            userInput.leaveDays,
                            userInput.leaveDate
                        ))
                    ]
                })


            }      
            return stepContext.endDialog();
        }catch(error){
            console.log(error)
        }
    }
}

module.exports.ApplyLeave = ApplyLeave;