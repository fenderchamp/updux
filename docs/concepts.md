 # Updux concepts

## effects

Updux effects are a superset of redux middleware. I kept that format, and the
use of `next` mostly because I wanted to give myself a way to alter 
actions before they hit the reducer, something that `redux-saga` and 
`rematch` don't allow.

An effect has the signature

```js
const effect = ({ getState, dispatch, getRootState, selectors}) 
                => next => action => { ... }
```

The first argument is like the usual redux middlewareApi, except
for the availability of selectors and of the root updux's state. 

Also, the function `dispatch` is augmented to be able to be called 
with the allowed actions as props. For example, assuming that the action
`complete_todo` has been declared somewhere, then it's possible to do:

```js
updux.addEffect( 'todo_bankrupcy',
    ({ getState, dispatch }) => next => action => {
        getState.forEach( todo => dispatch.complete_todo( todo.id ) );
    }
)
```