var mod = bigMod = {
    workers: {},
    fun: {},
    gen: {},
    isNodejs: function () {
        return typeof process !== 'undefined'
    },
    getCliArgs: function () {
        if (bigMod.isNodejs()) {
            return process.argv.slice(2)
        } else {
            return []
        }
    },
    makeWorker: function (fun) {
        if (bigMod.isNodejs()) return;

        var newFuns = []
        var c = console.log
        console.log = function () {}
        var funMod = fun()
        console.log = c
        for (var prop in funMod) {
            newFuns.push('mod[' + JSON.stringify(prop) + '] = ' + funMod[prop].toString())
        }
        var onmessage = function (event) {
            try {
                var args = event.data
                args = Array.isArray(args) ? args : [args]
                console.log('WORKER REQUEST RECEIVED', Date.now())
                var answers = mod.solve.apply(mod, args)
                console.log('WORKER RESPONSE SENDING', Date.now())
                if (answers instanceof Error) throw answers
                var lines = answers.map(function (answer) {
                    return answer.line.trim()
                }).join('\n').trim()
                postMessage(lines)
            } catch (error) {
                postMessage(error)
            }
        }
        var errorPrototypeJson = function () {
            return {
                name: this.name,
                message: this.message,
                stack: this.stack.split('\n').map(function (line) {
                    return line.trim();
                }),
            };
        }

        newFuns.unshift('console.log(typeof importScripts)')
        newFuns.unshift('onmessage = ' + onmessage.toString())
        newFuns.unshift('var mod = {}')
        newFuns.unshift('Error.prototype.toJSON = ' + errorPrototypeJson.toString())
        var js = newFuns.join('\n')
        var blob = new Blob([js], {'content-type': 'application/javascript'})
        var blobUrl = URL.createObjectURL(blob)
        return new Worker(blobUrl)
    },
}

Error.prototype.toJSON = function () {
    return {
        name: this.name,
        message: this.message,
        stack: this.stack.split('\n').map(function (line) {
            return line.trim();
        }),
    };
};

mod.gen.goseigenSecretsofgrindea = function goseigenSecretsofgrindea(ownName) {
    var mod = {}

    mod.interpolation = function (syms) {
        var inter = []

        if (syms.length < 3) {
            inter.push(syms[0] + syms[1])
            inter.push(syms[1] + syms[0])
        } else {
            for (var i = 0; i < syms.length; i++) {
                var slice = syms.slice(0, i).concat(syms.slice(i + 1))
                var inter2 = mod.interpolation(slice)
                for (var j = 0; j < inter2.length; j++) {
                    inter.push(syms[i] + inter2[j])
                }
            }
        }

        return inter
    }

    mod.solve = function (signs, nums, ans) {
        if (!('string' === typeof(signs) && signs.length > 0)) return new Error('signs must be a valid string')
        if (!('string' === typeof(nums) && nums.length > 0)) return new Error('numbers must be a valid string')
        if (!(Number.isFinite(ans) && ans === ~~ans)) return new Error('expected answer must be a valid integer')
        if (!(signs.length + 1 === nums.length)) return new Error('the amount of numbers must be 1 more than the amount of signs')

        signs = signs.split('')
        var validSigns = ['+', 'x', '-']
        var areAllValidSigns = signs.every(function (sign) {
            return validSigns.includes(sign)
        })
        if (!areAllValidSigns) return new Error('the only valid signs are: ' + validSigns.join(' '))
        signs = signs.map(function (sign) { return sign === 'x' ? '*' : sign })

        nums = nums.split('')
        var validNums = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
        var areAllValidNums = nums.every(function (num) {
            return validNums.includes(num)
        })
        if (!areAllValidNums) return new Error('the only valid numbers are: ' + validNums.join(' '))

        var startMs = -Date.now()

        function getDuration() {
            return startMs + Date.now()
        }

        var uniqueAnswers = new Set
        var answers = []

        if (signs.length === 1) {
            answers.push(nums[0] + signs[0] + nums[1])
            answers.push(nums[1] + signs[0] + nums[0])
        } else {
            var uniqueSi = {}
            var signsInterpolation = mod.interpolation(signs)
            for (var i = 0; i < signsInterpolation.length; i++) {
                uniqueSi[signsInterpolation[i]] = 1
            }
            signsInterpolation = Object.keys(uniqueSi)

            var uniqueNums = {}
            var numsInterpolation = mod.interpolation(nums)
            for (var i = 0; i < numsInterpolation.length; i++) {
                uniqueNums[numsInterpolation[i]] = 1
            }
            numsInterpolation = Object.keys(uniqueNums)

            for (var i = 0; i < numsInterpolation.length; i++) {
                for (var j = 0; j < numsInterpolation[i].length; j++) {
                    for (var k = 0; k < signsInterpolation.length; k++) {
                        var answer = ''

                        answer += '('.repeat(signsInterpolation[k].length)

                        for (var l = 0; l < signsInterpolation[k].length; l++) {
                            answer += numsInterpolation[i][l]
                            answer += ')'
                            answer += signsInterpolation[k][l].replace('x', '*')
                        }

                        answer += numsInterpolation[i][numsInterpolation[i].length - 1]
                        answers.push(answer)
                    }
                }
            }
        }

        while (answers.length) {
            try {
                var answer = answers.shift()
                if (eval(answer + '===' + ans)) {
                    uniqueAnswers.add(answer)
                }
            } catch (e) {}
        }

        answers = []
        uniqueAnswers.forEach(function (answer) {
            var gameAnswer = answer.replace(/[()]/g, '')
            var line = ans + ' = ' + gameAnswer.replace(/(\D)/g, ' $1 ')

            answers.push({
                jsAnswer: answer,
                gameAnswer: gameAnswer,
                line: line,
            })
        })

        console.log('===')
        console.log('SOLVING')
        console.log('DURATION = ' + getDuration() + 'ms')
        console.log('SIGNS', signs)
        console.log('NUMBERS', nums)
        console.log('ANSWER', ans)
        console.log('ANSWERS', answers.length)

        return answers
    }

    mod.main = function () {
        var args = bigMod.getCliArgs()
        if (args.shift() !== ownName) return;
        var signs = args[0]
        var nums = args[1]
        var expectedAnswer = parseInt(args[2])

        console.log('SIGNS', signs)
        console.log('NUMS', nums)
        console.log('EXPECTED ANSWER', expectedAnswer)

        var answers = mod.solve(signs, nums, expectedAnswer)
        if (Array.isArray(answers)) {
            for (var i = 0; i < answers.length; i++) {
                var math = answers[i].gameAnswer.replace(/(\D)/g, ' $1 ')
                console.log(i + 1, math + ' = ' + expectedAnswer)
            }
        } else {
            console.log('ERROR CALCULATING ANSWER')
        }
    }

    if (bigMod.getCliArgs().length > 0) {
        return mod.main()
    }

    if (bigMod.isNodejs()) {
        module.exports = mod
    } else if (ownName) {
        console.log('Usage:')
        console.log('  node app.js ' + ownName + ' <SIGNS> <NUMBERS> <EXP_ANSWER>')
        console.log('Example: node app.js +x++ 74291 41')
        console.log('Example: node app.js xx+- 23232 16')
    }

    return mod
}

mod.main = function () {
    for (var prop in mod.gen) {
        mod.fun[prop] = mod.gen[prop](prop)
        if (!bigMod.isNodejs()) {
            mod.workers[prop] = mod.makeWorker(mod.gen[prop].bind(prop))
        }
    }
}

mod.main()
