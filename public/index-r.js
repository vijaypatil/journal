/* global m, R */
'use strict'

const Store = {

  events: [],
  eventsMap: {},
  fnGroupByDate: R.groupBy((e) => (e.createdAt.split('T')[0])),

  groupByDate() {
    Store.eventsMap = Store.fnGroupByDate(Store.events)
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

const Events = {
  oncreate: Store.fetchNotes,
  view() {
    const dates = Object.keys(Store.eventsMap).reverse()
    return (Store.events.length === 0)
      ? m('.well well-lg', 'There are no events yet...')
      : dates.map((date) => (
          m('p', [
            m('h4', date),
            Store.eventsMap[date].map((e) => {
              return m('div', [
                // m('span.glyphicon.glyphicon-remove-circle', {
                //     'aria-hidden':true,
                //     onclick: Entry.deleteEntry(e.id)
                // }),
                // <i class="fa fa-camera-retro"></i>
                m('span', {onclick: Entry.setupEditEntry(e.id)}, e.note),
                m('i.fa.fa-ban.pull-right', {onclick: Entry.deleteEntry(e.id), 'aria-hidden':true,}),
                m.trust(' &nbsp; &nbsp; '), // Delete icon to the right is difficult to select.
              ])
            })
          ])))
  }
}

const Entry = {
  value: '',
  inAdd: true,
  oldRec: {},
  index: 0,
  setValue(v) {
    Entry.value = v
  },
  keyUp(e) {
    if (e.keyCode === 13) {
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
