const {
  ComponentDialog,
  WaterfallDialog,
  ChoicePrompt,
  ChoiceFactory,
  NumberPrompt,
  TextPrompt,
  Dialog,
} = require("botbuilder-dialogs");
const { applyLeaveDialog } = require("../constants");
const { confirmLeave, leaveApplicationForm } = require("../cards/cards");
const { CardFactory } = require("botbuilder-core");
const Recognizers = require("@microsoft/recognizers-text-suite");

//Constants
const applyLeaveDialogWaterfall1 = "applyLeaveDialogWaterfall1";
const applyLeaveDialogWaterfall2 = "applyLeaveDialogWaterfall2";
const ChoicePromptDialog = "ChoicePromptDialog";
const NumberPromptDialog = "NumberPromptDialog";
const TextPromptDialog = "TextPromptDialog";

const applyLeaveDataAccessor = "applyLeaveDataAccessor";

let dialogState;

class ApplyLeave extends ComponentDialog {
  constructor(conversationState) {
    super(applyLeaveDialog);

    if (!conversationState) throw new Error("Conversation State is not found");

    this.conversationState = conversationState;
    this.applyLeaveDataAccessor = this.conversationState.createProperty(
      applyLeaveDataAccessor
    );

    this.addDialog(new ChoicePrompt(ChoicePromptDialog));
    this.addDialog(new NumberPrompt(NumberPromptDialog));
    this.addDialog(new TextPrompt(TextPromptDialog));

    // this.addDialog(new WaterfallDialog(applyLeaveDialogWaterfall1,[
    //     this.askLeaveType.bind(this),
    //     this.askNoOfDays.bind(this),
    //     this.askDateOfLeave.bind(this),
    //     this.leaveConfirmation.bind(this)
    // ]))

    this.addDialog(
      new WaterfallDialog(applyLeaveDialogWaterfall2, [
        this.preprocessEntities.bind(this),
        this.askLeaveType.bind(this),
        this.askNoOfDays.bind(this),
        this.askDateOfLeave.bind(this),
        this.leaveConfirmation.bind(this)
      ])
    );

    this.initialDialogId = applyLeaveDialogWaterfall2;
  }

  // async askLeaveType(stepContext){
  //     return await stepContext.prompt(ChoicePromptDialog,{
  //         prompt : 'Please help me with the type of leave you want to apply for',
  //         choices : ChoiceFactory.toChoices([
  //             'Sick Leave',
  //             'Casual Leave',
  //             'Earned Leave'
  //         ])
  //     })
  // }

  // async askNoOfDays(stepContext){
  //     let dialogState = await this.applyLeaveDataAccessor.get(stepContext.context,{});
  //     dialogState.leaveType = stepContext.result.value;
  //     return await stepContext.prompt(NumberPromptDialog,`For How many days you want to apply for ${dialogState.leaveType}`);
  // }

  // async askDateOfLeave(stepContext){
  //     let dialogState = await this.applyLeaveDataAccessor.get(stepContext.context);
  //     dialogState.leaveDays = stepContext.result;
  //     return await stepContext.prompt(TextPromptDialog,`From which date you want to apply for you ${dialogState.leaveType} leave application of ${dialogState.leaveDays} days?`);
  // }

  // async leaveConfirmation(stepContext){
  //     let dialogState = await this.applyLeaveDataAccessor.get(stepContext.context);
  //     dialogState.leaveDate = stepContext.result;
  //     await stepContext.context.sendActivity({
  //         attachments : [
  //             CardFactory.adaptiveCard(confirmLeave(
  //                 dialogState.leaveType,
  //                 dialogState.leaveDays,
  //                 dialogState.leaveDate
  //             ))
  //         ]
  //     })
  //     return await stepContext.endDialog();
  // }

  //with form

  async preprocessEntities(stepContext){
    try{
      if(stepContext.options && stepContext.options.luisResult){
        // console.log(stepContext.options.entities);

        let numberEntity = stepContext.options.entities.number ? stepContext.options.entities.number[0] : null;

        let leaveTypesEntity = stepContext.options.entities.leaveTypes ? stepContext.options.entities.leaveTypes[0][0] : null;

        let dateTimeEntity = stepContext.options.entities.datetimeV2 ? stepContext.options.entities.datetimeV2 : null;

        let dateFrameObj = {}

        if(dateTimeEntity != null){
          dateTimeEntity.forEach((subEntities, index)=>{
            if(subEntities.type === 'duration'){
              dateFrameObj['duration'] = subEntities.values[0]['timex'].replace("P",
              "").replace("D","");
            }

            if(subEntities.type === 'date'){
              dateFrameObj['date'] = subEntities.values[0]["resolution"][0]["value"];
            }
          })
        }

        stepContext.values.Entities = {
          numberEntity,
          leaveTypesEntity,
          dateFrameObj
        }

        console.log()

        return stepContext.next();
      }
    }catch(error){
      console.log(error);
    }
  }

  async askLeaveType(stepContext){
        console.log(stepContext.values.Entities);
        if(stepContext.values.Entities.leaveTypesEntity)
        {
          return await stepContext.next();
        }
        else{
           return await stepContext.prompt(ChoicePromptDialog,{
            prompt : 'Please help me with the type of leave you want to apply for',
            choices : ChoiceFactory.toChoices([
                'Sick Leave',
                'Casual Leave',
                'Earned Leave'
            ])
        })
        }
    }

    async askNoOfDays(stepContext){
      dialogState = await this.applyLeaveDataAccessor.get(stepContext.context,{});
      if(stepContext.values.Entities.leaveTypesEntity){       
        dialogState.leaveType = stepContext.values.Entities.leaveTypesEntity;
      }
      else{
      dialogState.leaveType = stepContext.result.value;
      }

      if(!stepContext.values.Entities.dateFrameObj.duration){
        return await stepContext.prompt(NumberPromptDialog,`For How many days you want to apply for?`);
      }else{
        return await stepContext.next();
      }
  }

    async askDateOfLeave(stepContext){
      if(stepContext.values.Entities.dateFrameObj.duration){
        dialogState.leaveDays = stepContext.values.Entities.dateFrameObj.duration;
        // console.log('In Ask Date of Leave ', dialogState);
        return await stepContext.next();
      }else{
        const results = Recognizers.recognizeNumber(
          stepContext.result,
          Recognizers.Culture.English
        );
        let output;
        results.forEach(async(result) => {
          const value = result.resolution.value;
          if (value) {
            console.log('Inside If',value);
            const days = parseInt(value);
            if (!isNaN(days) && days >= 0 && days <= 3) {
              dialogState.leaveDays = days;
              return await stepContext.next();
            }
            else{
              await stepContext.context.sendActivity('You cannot take leave for more then 3 days in a row');
              return Dialog.EndOfTurn;
            }
          }
        })
        
      }

      if(!stepContext.values.Entities.dateFrameObj.date){
        return await stepContext.prompt(TextPromptDialog,`From which date you want to apply for you leave application`);
      }
      else{
        return await stepContext.next();
      }
  }

  async leaveConfirmation(stepContext){
      if(stepContext.values.Entities.dateFrameObj.date){
        dialogState.leaveDate = stepContext.values.Entities.dateFrameObj.date;
      }else{
        dialogState.leaveDate = stepContext.result;
      }
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
  


  // async showForm(stepContext) {
  //   try {
  //     console.log(stepContext.values.Entities);
  //     if (stepContext.options && stepContext.options.formRefill) {
  //       return stepContext.next();
  //     } else {
  //       await stepContext.context.sendActivity({
  //         attachments: [CardFactory.adaptiveCard(leaveApplicationForm())],
  //       });
  //       return Dialog.EndOfTurn;
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }

  // async preprocessUserInput(stepContext) {
  //   try {
  //     let dialogState = await this.applyLeaveDataAccessor.get(
  //       stepContext.context,
  //       {}
  //     );
  //     let userInput;
  //     if (stepContext.options && stepContext.options.formRefill) {
  //       userInput = stepContext.options.values;
  //     } else {
  //       userInput = stepContext.context.activity.value;
  //     }
  //     console.log(userInput);
  //     dialogState.leaveType = userInput.leaveType;
  //     dialogState.leaveDays = userInput.leaveDays;
  //     dialogState.leaveDate = userInput.leaveDate;
  //     if (parseInt(dialogState.leaveDays) > 3) {
  //       await stepContext.context.sendActivity(
  //         "You can only apply for 3 days of leave in a row. Please enter the number of details once again"
  //       );
  //       return await stepContext.endDialog();
  //     } else {
  //       if (
  //         dialogState.leaveType &&
  //         dialogState.leaveDays &&
  //         dialogState.leaveDate
  //       ) {
  //         await stepContext.context.sendActivity({
  //           attachments: [
  //             CardFactory.adaptiveCard(
  //               confirmLeave(
  //                 dialogState.leaveType,
  //                 dialogState.leaveDays,
  //                 dialogState.leaveDate
  //               )
  //             ),
  //           ],
  //         });
  //       } else {
  //         await stepContext.context.sendActivity(
  //           "Please Fill All the Fields to proceed"
  //         );
  //       }
  //       return stepContext.next();
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }
}

module.exports.ApplyLeave = ApplyLeave;
