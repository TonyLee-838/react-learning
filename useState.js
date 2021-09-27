//Global
var isMount = true;
var workInProgressHook = null;
var App_CurrentFiber = {
    memorizedState: null,
    stateNode: App,
    ref: null,
};
function useState(initialState) {
    var hook = null;
    if (isMount) {
        //init hook
        hook = {
            queue: {
                pending: null,
            },
            memorizedState: initialState,
            next: null,
        };
        //新hook注冊到組件組件中
        if (!App_CurrentFiber.memorizedState) {
            //First Hook
            App_CurrentFiber.memorizedState = hook;
        }
        else {
            //Append Hook
            workInProgressHook.next = hook;
        }
        //Move pointer to the very last hook
        workInProgressHook = hook;
    }
    else {
        //take first hook
        hook = workInProgressHook;
        //move pointer to the next hook
        workInProgressHook = workInProgressHook.next;
    }
    var baseState = hook.memorizedState;
    var hasPendingHooks = !!hook.queue.pending;
    if (hasPendingHooks) {
        //hook.queue.pending =(next)=> lastUpdate =(next)> firstUpdate
        var firstUpdate = hook.queue.pending.next;
        do {
            var updatedState = firstUpdate.action(baseState);
            baseState = updatedState;
            firstUpdate = firstUpdate.next;
        } while (hook.queue.pending.next !== firstUpdate);
        //All pending hook are processed.Clean up the queue.
        hook.queue.pending = null;
    }
    hook.memorizedState = baseState;
    return [
        baseState,
        function (action) { return dispatchAction(hook.queue, action); },
    ];
}
function App() {
    var _a = useState(0), number = _a[0], setNumber = _a[1];
    function handleClick() {
        setNumber(function (number) { return number + 1; });
    }
    console.log("<button>" + number + "</button>");
    return {
        type: "button",
        key: null,
        click: function () {
            handleClick();
        },
    };
}
function dispatchAction(queue, action) {
    var update = {
        next: null,
        action: action,
    };
    if (!queue.pending) {
        //環狀鏈表構建
        update.next = update;
    }
    else {
        //1)
        //                  queue.pending
        //                        v
        //              A -> B -> C ;
        //              ^         |
        //              |_________|
        update.next = queue.pending.next;
        //2)
        //                  queue.pending
        //                        v
        //         U -> A -> B -> C ;
        //              ^         |
        //              |_________|
        queue.pending.next = update;
        //3)
        //                  queue.pending
        //                        v
        //         U -> A -> B -> C ;
        //         ^              |
        //         |______________|
    }
    queue.pending = update;
    //4)
    // queue.pending
    //        v
    //        U -> A -> B -> C ;
    //        ^              |
    //        |______________|
    scheduleUpdates();
}
function scheduleUpdates() {
    //hook以鏈表結構連接
    var firstHook = App_CurrentFiber.memorizedState;
    //當前正在工作的hook
    workInProgressHook = firstHook;
    //render App()
    App_CurrentFiber.ref = App_CurrentFiber.stateNode();
    isMount = false;
}
function mount() {
    var ref = App();
    isMount = false;
    return ref;
}
function renderButton() {
    console.log("render!!!");
    var _a = mount(), click = _a.click, print = _a.print;
    click();
    click();
    click();
    click();
}
renderButton();