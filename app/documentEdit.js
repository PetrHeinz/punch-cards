export function appendHeading(element) {
    const heading = document.createElement("h1")
    heading.classList.add("line")
    heading.textContent = "PUNCH_CARDS"
    element.append(heading)
    return heading
}

export function appendButton(element, text, callback) {
    const button = document.createElement('div')
    button.classList.add('button')
    button.classList.add('clickable')
    button.textContent = text
    button.addEventListener("click", () => callback())
    element.append(button)
    return button
}

export function appendLine(element, text) {
    const message = document.createElement('div')
    message.classList.add('line')
    message.append(text)
    element.append(message)
    return message
}

export function appendBlankLine(element) {
    appendLine(element, " ")
}

export function appendInput(element, labelText, value) {
    const input = document.createElement("input")
    input.classList.add("input")
    input.value = value
    const label = document.createElement("label")
    label.classList.add("line")
    label.append(labelText + ": ")
    label.append(input)
    element.append(label)

    return input
}

export function clear(element) {
    element.innerHTML = ""
}
