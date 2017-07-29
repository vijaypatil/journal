/* global m */
'use strict'

var events = []

const fetchNotes = () => {
  m.request({method: 'get', url: '/sigevents'})
    .then((response) => {
      events = response
    })
    .catch((e) => {
      alert(e.message)
    })
}

const saveNote = (note) => {
  m.request({method: 'post', url: '/sigevents', data: note})
}

const deleteNote = (id) => {
  m.request({method: 'delete', url: `/sigevents/${id}`})
}

const editNote = (rec) => {
  m.request({method: 'put', url: `/sigevents/${rec.id}`, data: rec})
}

const Events = {
  oncreate: fetchNotes,
  view() {
    return (events.length === 0)
      ? m('.well well-lg', 'There are no events yet...')
      : events.map((e) => (
          m('div', [
            m('span.glyphicon.glyphicon-remove-circle', {
                'aria-hidden':true,
                onclick: Entry.deleteEntry(e.id)
            }),
            m.trust(' &nbsp; '),
            m('span', {onclick: Entry.setupEditEntry(e.id)}, e.note)
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
      const index = events.findIndex(((e) => e.id === id))
      if (index >= 0) {
        Entry.index = index
        Entry.value = events[index].note
        Entry.oldRec = Object.assign({}, events[index])
        Entry.inAdd = false
        document.querySelector('#editor').focus()
      }
    }
  },
  deleteEntry(id) {
    return () => {
      const index = events.findIndex(((e) => e.id === id))
      if (index >= 0) {
        events.splice(index, 1)
        deleteNote(id)
      }
    }
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
      events.push(rec)
      saveNote(rec)
    } else {
      Entry.oldRec.note = v
      events[Entry.index] = Object.assign({}, Entry.oldRec)
      editNote(Entry.oldRec)
    }
    document.querySelector('#editor').focus()
    Entry.setValue('')
    Entry.inAdd = true
  }
}

const Main = {
  view() {
    return [
      m('h3', "Day's Journal"),
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
            m('button.btn.btn-default.button-outline', {onclick: Entry.saveEntry}, 'Done!')))),
      m(Events)
    ]
  }
}

m.mount(document.querySelector('#app'), Main)

function guid() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});
}
