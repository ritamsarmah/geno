// var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
// var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList
// var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent

export default class Speech {
}
//     constructor() {
//         this.finalTranscript = '';
//         this.interimTranscript = '';
//         this.isListening = false;

//         this.recognition = new webkitSpeechRecognition();
//         this.recognition.continuous = true;
//         this.recognition.interimResults = true;
//         this.recognition.lang = 'en-us';
//         this.recognition.maxAlternatives = 1;

//         this.recognition.onstart = function () {
//             console.log("Listening");
//             this.finalTranscript = '';
//         };

//         // TODO: Implement as generator
//         this.recognition.onresult = function (event) {
//             this.finalTranscript = '';
//             this.interimTranscript = '';

//             if (event.results) {
//                 var result = event.results[event.resultIndex];
//                 var transcript = result[0].transcript;
//                 if (result.isFinal) {
//                     if (result[0].confidence < 0.3) {
//                         console.log("Unrecognized Speech");
//                     } else {
//                         this.interimTranscript = transcript.trim();
//                     }
//                 } else {
//                     this.interimTranscript;
//                 }
//             }
//             this.finalTranscript += this.interimTranscript;
//         };

//         this.recognition.onend = function () {
//             console.log("Heard:", this.finalTranscript);
//         };
//     }

//     record(completion) {
//         this.startListening();
//         // TODO completion callback to return finaltranscript;
//     }

//     startListening() {
//         if (!this.isListening) {
//             this.recognition.start();
//             this.isListening = true
//         }
//     }

//     stopListening() {
//         if (this.isListening) {
//             this.recognition.stop();
//             this.isListening = false;
//         }
//     }
// }
