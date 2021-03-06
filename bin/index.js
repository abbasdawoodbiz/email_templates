#! /usr/bin/env node
const _ = require('lodash');
let fs = require('fs');
const yargs = require("yargs");
const chalk = require('chalk');

let promises = []

const boxenOptions = {
    backgroundColor: "black"
};

let sections = {
    transactional: {
        header: 'header_txnal',
        footer: 'footer_txnal'
    },
    marketing: {
        header: 'header_marketing',
        footer: 'footer_marketing'
    },
    table: {
        vertical: 'table_v',
        horizontal: 'table_h'
    },
    text: {
        block: 'text_block',
        warning: 'text_warning',
        image_left: 'text_image_left',
        image_top: 'text_image_top'
    },
    button: {
        center: 'button_block_center',
        left: 'button_block_left',
        right: 'button_block_right'
    },
    head: 'head'
}

let defaults = {
    template: 'transactional',
    body: 'text,button'
}

const options = yargs
    .usage('Usage: -t <template type>')
    .option('t', { alias: 'template', describe: "Which template to use, one of marketing or transactional", type: 'string', demandOption: true })
    .option('b', { alias: 'body', describe: "Comma separated values from this list: text(:block|:warning|:image_left|:image_top),button(:left|:center|:right),table (:vertical|:horizontal).", type: 'string', demandOption: false })
    .option('p', { alias: 'path', describe: "Absolute path where the files have to be generated, default is current working directory", type: 'string', demandOption: false })
    .argv;

/**
 * Function to build the final template based on inputs given by devs
 */
function main() {
    let args = process.argv.slice(1)

    console.log(chalk.green.bold('💡Rubbing the lamp..'));

    let customisation = {}

    customisation.template = options.template || defaults.template
    customisation.body = options.body || defaults.body
    customisation.cwd = options.path || '.'

    createMarkup(customisation)
}

function createMarkup(options) {

    let header = sections[options.template].header
    let footer = sections[options.template].footer

    console.log(chalk.white.bold('📝 Writing head..'));

    promises.push(fs.readFileAsync(options.cwd, sections.head))

    console.log(chalk.white.bold(`📝 Building ${options.template} template..`));

    promises.push(fs.readFileAsync(options.cwd, header))

    console.log(chalk.white.bold('🍼 Adding body...'));

    _.forEach(options.body.split(','), partial => {
        let s = partial.split(':')
        if (s.length > 1) {
            promises.push(fs.readFileAsync(options.cwd, sections[s[0]][s[1]]))
        } else {
            let keys = _.keys(sections[s[0]])
            promises.push(fs.readFileAsync(options.cwd, sections[s[0]][keys[0]]))
        }
    })


    promises.push(fs.readFileAsync(options.cwd, footer))

    Promise.all(promises).then(data => {
        console.log(chalk.white.bold('✅ Finishing up..'));
        writeTemplate(options.cwd, data.join('\n'), 'email_output', 'html')
    })
}

function writeTemplate(wd, content, filename, format) {
    let file = wd + `/${filename}.${format}`
    fs.writeFile(file, content, 'utf-8', (err) => {
        if (err) {
            console.error(err);
        }
        console.log('📧 Output generated at: ' + chalk.green(file));
    });
}

fs.readFileAsync = (cwd, partialName) => {
    return new Promise((resolve, reject) => {
        // TODO: allow override of partials
        let path = __dirname + `/partials/${partialName}.txt`
        fs.readFile(path, { encoding: 'utf-8' }, (err, data) => {
            if (err) {
                reject(err)
            } else {
                resolve(data)
            }
        });
    });
}

module.exports = {
    main: main
}

main();