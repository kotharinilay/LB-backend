export function validMessage(type: any, min?: number, max?: number) {
    return {
      language: {
        string: {
          base: '!!Please enter a valid ' + type + '.',
          allowOnly: '!!Please select a valid ' + type + '.',
          email: '!!Please enter a valid email.',
          min: '!!'+ type +' length should be minimum ' + min + ' characters.',
          max: '!!'+ type +' length should not be greater than ' + max + ' characters.'
        },
        number: {
          base: '!!Please enter a valid ' + type + '.',
          allowOnly: '!!Please select a valid ' + type + '.',
          min: '!!Minimum number of '+ type +' allowed are ' + min + '.',
          max: '!!Maximum number of '+ type +' allowed are ' + max + '.'
        },
        boolean: {
          base: '!!Please enter a valid ' + type + '.',
          allowOnly: '!!Please select a valid ' + type + '.'
        },
        any: {
          allowOnly: '!!Please select a valid ' + type + '.',
          required: '!!' + type + ' is required.'
        }
      }
    }
  }

  export class Messages {
    public static NOT_ALLOWED: string = 'Not allowed';
  }