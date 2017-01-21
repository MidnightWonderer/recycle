import React, { PropTypes } from 'react'
import classnames from 'classnames'
import { TEXT_INPUT } from '../../constants/ActionTypes'

export default function TodoTextInput (props) {
  return {
    propTypes: {
      text: PropTypes.string,
      placeholder: PropTypes.string,
      editing: PropTypes.bool,
      newTodo: PropTypes.bool
    },

    initialState: {
      text: props.text || ''
    },

    actions (sources) {
      return [
        sources.select('input')
          .on('keyDown')
          .filter(e => e.which === 13)
          .filter(e => e.target.value.length)
          .map(e => ({ type: TEXT_INPUT, value: e.target.value })),

        sources.select('input')
          .on('blur')
          .filter(() => !props.newTodo)
          .filter(e => e.target.value.length)
          .map(e => ({ type: TEXT_INPUT, value: e.target.value }))
      ]
    },

    reducers (sources) {
      return [
        sources.select('input')
          .on('change')
          .reducer((state, e) => {
            state.text = e.target.value
            return state
          }),

        sources.actions
          .filterByType(TEXT_INPUT)
          .filter(() => props.newTodo)
          .reducer(state => {
            state.text = ''
            return state
          })
      ]
    },

    view (props, state) {
      return (
        <input
          className={
            classnames({
              edit: props.editing,
              'new-todo': props.newTodo
            })
          }
          value={state.text}
          type='text'
          placeholder={props.placeholder}
          autoFocus='true' />
      )
    }
  }
}