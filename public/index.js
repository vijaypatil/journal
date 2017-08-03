/* global m, R */
'use strict'

/**
 * Connect to backend.
 */
const Store = {
  // All our Notes belong here!
  events: [],

  // The key will be the locale date of the note's timestamp.
  eventsMap: {},

  // We will be grouping by date strings such as 2017-7-30, rather than 2017-07-30.
  // The difference does not matter, since we are consistent with the date format.
  // Also, the LocaleDate will take care of UTC to local date conversion.
  fnGroupByDate: R.groupBy((e) => (new Date(e.createdAt).toLocaleDateString())),

  groupByDate() {
    Store.eventsMap = Store.fnGroupByDate(Store.events)
  },

  groupByDateFiltered(_events) {
    Store.eventsMap = Store.fnGroupByDate(_events)
  },

  fetchNotes() {
    m.request({method: 'get', url: '/sigevents'})
      .then((response) => {
        Store.events = response
        Store.groupByDate()
      })
      .catch((e) => {
        alert(e.message)
      })
    },

  saveNote(note) {
    m.request({method: 'post', url: '/sigevents', data: note})
    Store.groupByDate()
  },

  deleteNote(id) {
    m.request({method: 'delete', url: `/sigevents/${id}`})
    Store.groupByDate()
  },

  editNote(rec) {
    m.request({method: 'put', url: `/sigevents/${rec.id}`, data: rec})
    Store.groupByDate()
  }
}

/**
 * A single note entry is managed thusly.
 * Interfaces Mithril components & the Store.
 */
const Entry = {
  value: '',
  inAdd: true,
  oldRec: {},
  index: 0,
  setValue(v) {
    Entry.value = v
    const searchprompt = ':s '
    const cmd = v.trim()
    if ((cmd.startsWith(searchprompt) || cmd.startsWith(':q ')) && cmd.length > searchprompt.length) {
      const searchterm = v.substring(searchprompt.length).trim().toLowerCase()
      const matchedNotes = Store.events.filter((e) => e.note.toLowerCase().indexOf(searchterm) >= 0)
      if (matchedNotes.length > 0) {
        Store.groupByDateFiltered(matchedNotes)
      }
    } else {
      Store.groupByDate()
    }
  },
  keyUp(e) {
    if (e.keyCode === 13 && !Entry.value.startsWith(':')) {
      Entry.saveEntry()
    }
  },
  setupEditEntry(id) {
    return () => {
      const index = Store.events.findIndex(((e) => e.id === id))
      if (index >= 0) {
        Entry.index = index
        Entry.value = Store.events[index].note
        Entry.oldRec = Object.assign({}, Store.events[index])
        Entry.inAdd = false
        document.querySelector('#editor').focus()
      }
    }
  },
  deleteEntry(id) {
    return () => {
      const index = Store.events.findIndex(((e) => e.id === id))
      if (index >= 0) {
        Store.events.splice(index, 1)
        Store.deleteNote(id)
      }
    }
  },
  newEntry() {
    Entry.inAdd = true
    Entry.value = ''
    document.querySelector('#editor').focus()
  },
  saveEntry() {
    const v = Entry.value.trim()
    if (v == '') {
      return
    }
    if (Entry.inAdd) {
      const rec = {}
      rec.id = guid()
      rec.note = v
      rec.createdAt = new Date().toISOString()
      Store.events.push(rec)
      Store.saveNote(rec)
    } else {
      Entry.oldRec.note = v
      Store.events[Entry.index] = Object.assign({}, Entry.oldRec)
      Store.editNote(Entry.oldRec)
    }
    document.querySelector('#editor').focus()
    Entry.setValue('')
    Entry.inAdd = true
  }
}

const highlightLink = (note) => {
  let protopos = note.indexOf('https://')
  if (protopos < 0) {
    protopos = note.indexOf('http://')
  }
  if (protopos >= 0) {
    let i = protopos
    while (i < note.length && (note.charAt(i) != ' ')) {
      i++
    }
    const notestart = note.substring(0, protopos)
    const noteend = note.substring(i)
    const href = note.substring(protopos, i)
    return `${notestart} <a href='${href}' target=_blank>${href}</a> ${noteend}`
  }
  return note
}

/**
 * Mithril's provided View for all our Notes.
 */
const Events = {
  oncreate: Store.fetchNotes,
  view() {
    const dates = Object.keys(Store.eventsMap).reverse() // Latest first.
    return (Store.events.length === 0)
      ? m('.well well-lg', 'You have not made any notes yet... Make one now.')
      : dates.map((date) => (
          m('p', [
            m('h4', date),
            Store.eventsMap[date].map((e) => {
              return m('div.spaced', [
                m('i.fa.fa-ban', {onclick: Entry.deleteEntry(e.id), 'aria-hidden':true,}),
                m.trust(' &nbsp; &nbsp; '),
                m('span',
                    {onclick: Entry.setupEditEntry(e.id), style:'white-space:pre-line'},
                    m.trust(highlightLink(e.note)))
              ])
            })
          ])))
  }
}

/**
 * Our Main or `outer` component.
 * Houses all our Notes.
 */
const Main = {
  view() {
    return [
      m('h3', 'Journal',
        m.trust(' &nbsp; '),
        m('button.btn.btn-xs.btn-info', {onclick: Entry.newEntry}, 'New Note')),
      m('.col-md-12', {style:"padding-left:0px; margin-bottom:0.5em"},
        m('.input-group',
          m('input.form-control.pull-left[type=text]', {
            oninput: m.withAttr('value', Entry.setValue),
            onkeyup: Entry.keyUp,
            placeholder: 'What did you do today?',
            autofocus: true,
            value: Entry.value,
            id: 'editor',
          }),
          m('span.input-group-btn',
            m('button.btn.btn-default.button-outline', {onclick: Entry.saveEntry}, 'Save')))),
      m(Events)
    ]
  }
}

const guid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
  var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8)
  return v.toString(16)
})

m.mount(document.querySelector('#app'), Main)
