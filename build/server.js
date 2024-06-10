// server.js

const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from 'public' directory

app.post('/merge-zh', (req, res) => {
    const { content, direction } = req.body;
    const filePath = path.join(__dirname, 'public', 'c_zh.html');

    // Read the existing HTML file
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading file.');
        }

        // Process the merging
        const updatedData = mergeParagraphs(data, content, direction);

        // Write the changes back to the file
        fs.writeFile(filePath, updatedData, 'utf8', (err) => {
            if (err) {
                return res.status(500).send('Error writing to file.');
            }
            res.send('Merge completed successfully.');
        });
    });
});

function mergeParagraphs(data, targetContent, direction) {
    const lines = data.split('\n');
    const index = lines.findIndex(line => line.includes(targetContent));
    console.log('Target content:', targetContent);
    console.log('Direction:', direction);
    console.log('Index of target content:', index);

    if (index === -1) {
        console.error('Content not found');
        return data; // Content not found, return original data
    }

    console.log('Current paragraph:', lines[index]);
    if (index > 0) {
        console.log('Previous paragraph:', lines[index - 1]);
    }
    if (index < lines.length - 1) {
        console.log('Next paragraph:', lines[index + 1]);
    }

    // Merging logic
    if (direction === 'up' && index > 0) {
        const currentText = lines[index].match(/<p>(.*?)<\/p>/);
        if (currentText && currentText[1]) {
            const previousText = lines[index - 1].match(/<p>(.*?)<\/p>/);
            if (previousText && previousText[1]) {
                lines[index - 1] = lines[index - 1].replace(/<\/p>\s*$/, `${currentText[1]}</p>`);
                lines.splice(index, 1);
            } else {
                console.error('Previous paragraph does not contain valid <p> tags');
            }
        } else {
            console.error('Current paragraph does not contain valid <p> tags');
        }
    } else if (direction === 'down' && index < lines.length - 1) {
        const currentText = lines[index].match(/<p>(.*?)<\/p>/);
        if (currentText && currentText[1]) {
            const nextText = lines[index + 1].match(/<p>(.*?)<\/p>/);
            if (nextText && nextText[1]) {
                lines[index] = lines[index].replace(/<\/p>\s*$/, `${nextText[1]}</p>`);
                lines.splice(index + 1, 1);
            } else {
                console.error('Next paragraph does not contain valid <p> tags');
            }
        } else {
            console.error('Current paragraph does not contain valid <p> tags');
        }
    }

    console.log('Modified current paragraph:', lines[index - (direction === 'up' ? 1 : 0)]);
    return lines.join('\n');
}




app.post('/split-zh', (req, res) => {
    const { content, splitPoint } = req.body;
    const filePath = path.join(__dirname, 'public', 'c_zh.html');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading file.');
        }

        const updatedData = splitParagraph(data, content, splitPoint);

        fs.writeFile(filePath, updatedData, 'utf8', (err) => {
            if (err) {
                return res.status(500).send('Error writing to file.');
            }
            res.send('Split completed successfully.');
        });
    });
});

function splitParagraph(data, targetContent, splitPoint) {
    const lines = data.split('\n');
    const index = lines.findIndex(line => line.includes(targetContent));

    if (index === -1) {
        console.error('Content not found');
        return data; // Content not found, return original data
    }

    // 计算分割点，包含分割点文本的开始位置
    const splitIndex = lines[index].indexOf(splitPoint);
    const part1 = lines[index].substring(0, splitIndex);
    const part2 = lines[index].substring(splitIndex);

    // 在分割点插入 </p><p> 以形成两个独立的段落
    lines[index] = `${part1}</p>\n<p>${part2}`;

    return lines.join('\n');
}



app.post('/swap-zh', (req, res) => {
    const { content } = req.body;
    const filePath = path.join(__dirname, 'public', 'c_zh.html');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading file.');
        }

        const updatedData = swapParagraphs(data, content);

        fs.writeFile(filePath, updatedData, 'utf8', (err) => {
            if (err) {
                return res.status(500).send('Error writing to file.');
            }
            res.send('Swap completed successfully.');
        });
    });
});

function swapParagraphs(data, targetContent) {
    const lines = data.split('\n');
    const index = lines.findIndex(line => line.includes(targetContent));

    if (index === -1 || index === lines.length - 1) {
        console.error('Content not found or no next paragraph');
        return data; // Content not found or no next paragraph
    }

    // Swap the current paragraph with the next one
    const temp = lines[index];
    lines[index] = lines[index + 1];
    lines[index + 1] = temp;

    return lines.join('\n');
}


app.post('/split-ja', (req, res) => {
    const { content, splitPoint } = req.body;
    const filePath = path.join(__dirname, 'public', 'c_ja.html');  // 修改文件路径为日文部分

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading file.');
        }

        const updatedData = splitParagraph(data, content, splitPoint);

        fs.writeFile(filePath, updatedData, 'utf8', (err) => {
            if (err) {
                return res.status(500).send('Error writing to file.');
            }
            res.send('Split completed successfully.');
        });
    });
});
function splitParagraph(data, targetContent, splitPoint) {
    const lines = data.split('\n');
    const index = lines.findIndex(line => line.includes(targetContent));

    if (index === -1) {
        console.error('Content not found');
        return data; // 未找到内容，返回原数据
    }

    // 计算分割点
    const splitIndex = lines[index].indexOf(splitPoint);
    const part1 = lines[index].substring(0, splitIndex);
    const part2 = lines[index].substring(splitIndex);

    // 插入</p><p>，形成两个独立段落
    lines[index] = `${part1}</p>\n<p>${part2}`;

    return lines.join('\n');
}

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
