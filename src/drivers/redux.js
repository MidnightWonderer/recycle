import { shallowClone } from '../recycle'
import objectpath from 'objectpath'

export default (store) => (recycle, {Observable, Subject}) => {
  recycle.on('sourcesReady', (component) => {
    const container = component.get('container')
    if (container) {
      const actionsFunction = component.get('actions')
      const manualActions = new Subject()

      if (actionsFunction) {
        const actionsArr = forceArray(component.getActions())
        actionsArr.push(manualActions)
        const actionsStream = Observable.merge(...actionsArr)

        component._actionsSubscription = actionsStream.subscribe(a => {
          let action = a
          if (typeof a.reducer === 'function') {
            let storePath = component.get('storePath')
            let state = store.getState()

            if (storePath) {
              storePath = parsePath(storePath)
              state = getByPath(storePath, state)
            }

            action.type = 'RECYCLE_REDUCER'
            const recycleAction = a.action
            delete recycleAction.childComponent
            let recycleState = a.reducer(state, recycleAction)
            let changedState = shallowClone(recycleState)

            if (storePath) {
              let storeState = {...store.getState()}
              if (recycleState === false) {
                deleteByPath(storePath, storeState)
              } else {
                setByPath(storePath, recycleState, storeState)
              }
              recycleState = storeState
            }

            delete action.reducer
            action.changedState = changedState
            action.newState = recycleState
          }
          store.dispatch(action)
        })
      }

      component._reduxUnsubscribe = store.subscribe(() => {
        let storePath = component.get('storePath')
        let state = store.getState()

        if (storePath) {
          storePath = parsePath(storePath)
          state = getByPath(storePath, state)
        }
        component.setState(state)
      })

      let storePath = parsePath(component.get('storePath'))
      let storeState = {...store.getState()}

      if (storePath) {
        let newState = getByPath(storePath, storeState)
        if (newState) {
          component.replaceState(newState)
        }
      } else {
        component.replaceState(storeState)
      }

      if (actionsFunction && component.get('initialState')) {
        setByPath(storePath || [], component.get('initialState'), storeState)
        manualActions.next({
          type: 'RECYCLE_REDUCER',
          action: { type: '@@recycle/INIT' },
          changedState: storeState,
          newState: storeState
        })
      }
    }
  })

  recycle.on('componentWillUnmount', component => {
    if (component._actionsSubscription) {
      component._actionsSubscription.unsubscribe()
    }
    if (component._reduxUnsubscribe) {
      component._reduxUnsubscribe()
    }
  })

  return {
    name: 'redux'
  }
}

export function forceArray (arr) {
  if (!Array.isArray(arr)) return [arr]
  return arr
}

export function parsePath (path) {
  if (typeof path === 'string') {
    return objectpath.parse(path)
  }
  return path
}

export function getByPath (parts, current) {
  for (let i = 0; i < parts.length; ++i) {
    if (parts[i] !== '') {
      current = current[parts[i]]
    }
  }
  return current
}

export function setByPath (path, value, current) {
  path.forEach((i, index) => {
    if (index === path.length - 1) {
      if (i) {
        current[i] = value
      }
      return
    }
    if (!current[i]) {
      current[i] = {}
    }
    current = current[i]
  })
}

export function deleteByPath (parts, current) {
  for (let i = 0; i < parts.length; ++i) {
    if (i === parts.length - 1) {
      delete current[parts[i]]
    } else {
      current = current[parts[i]]
    }
  }
}
