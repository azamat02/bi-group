import {useEffect, useRef, useState} from "react";
import axios from "axios";
import {MagnifyingGlassIcon, PaperAirplaneIcon} from "@heroicons/react/24/solid";
import {IconBulb, IconCheck, IconChecks} from "@tabler/icons-react";
import {XMarkIcon} from "@heroicons/react/24/outline";

const backendURL = 'http://64.23.175.160:3000'
const wsURL = 'ws://64.23.175.160:8080'
// const backendURL = 'http://localhost:3000'
// const wsURL = 'ws://localhost:8080'

export interface Suggestion {
    id: number
    created_at: string
    first_name: string
    last_name: string
    suggestion: string
    user_id: string
    username: string
}

export async function fetchSuggestions(): Promise<Suggestion[]> {
    try {
        const response = await axios.get<Suggestion[]>(`${backendURL}/api/user/suggestions`);
        return response.data;
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        throw new Error('Failed to fetch suggestions');
    }
}

export interface Chat {
    clientId: number,
    messages: Message[],
    userInfo: UserInfo
}

export interface Message {
    messageId: number;
    message: string;
    fromConsultant: boolean;
    createdAt: string
    status: 'pending' | 'confirmed';
    tempMessageId?: number; // Temporary ID for optimistic UI updates
}

export interface UserInfo {
    firstName: string,
    languageCode: string,
    profileImageId: string,
    userId: string,
    username: string
}

export interface SidebarProps {
    chats: Chat[] | undefined,
    selectedChat: Chat | undefined,
    setSelectedChat: (value: Chat) => void
}

function setupPing(ws: WebSocket) {
    // Отправляем "пинг" каждые 30 секунд
    const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            console.log("Отправка 'пинга'");
            ws.send(JSON.stringify({ action: "ping" }));
        }
    }, 30000);

    return pingInterval;
}

function formatTime(date: Date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();

    // Добавление ведущего нуля, если число состоит из одной цифры
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}`;
}

function formatDate(date: Date) {
    const monthNames = ["Января", "Февраля", "Марта", "Апреля", "Мая", "Июня",
        "Июля", "Августа", "Сентября", "Октября", "Ноября", "Декабря"
    ];

    const day = date.getDate();
    const monthIndex = date.getMonth();
    const year = date.getFullYear();

    // Получаем текущий год
    const currentYear = new Date().getFullYear();

    // Форматируем дату
    let formattedDate = day + " " + monthNames[monthIndex];
    if (year !== currentYear) {
        formattedDate += ", " + year; // Добавляем год, если он не совпадает с текущим
    }

    return formattedDate;
}

function App() {
    const [chats, setChats] = useState<Chat[]>()
    const [selectedChat, setSelectedChat] = useState<Chat | null>()
    const [messageText, setMessageText] = useState('')
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<{ws: WebSocket | null, pingInterval: number}>({ws: null, pingInterval: 0});
    const [searchValue, setSearchValue] = useState('')
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const fetchChatHistory = async () => {
        try {
            const response = await axios.get(`${backendURL}/api/chats`); // Adjust the URL based on your API endpoint
            const data = response.data;
            setChats(data)
        } catch (error) {
            console.error('Failed to fetch chat history:', error);
        }
    };

    const addMessageToChatState = (message: Message, userId: string): void => {
        console.log(message)
        setChats((currentChats) => {
            if (currentChats?.length !== 0) {
                console.log(currentChats)
                return currentChats?.map(chat => {
                    if (!currentChats?.find((chat)=>{return chat.userInfo.userId === userId+''})) {
                        console.log(currentChats)
                        fetchChatHistory()
                    }
                    else if (chat.userInfo.userId === userId+'') {
                        return { ...chat, messages: [...chat.messages, message] };
                    }
                    return chat;
                })
            } else {
                fetchChatHistory()
            }
        });
    };

    const updateMessageStatusInChatState = (tempMessageId: number, newStatus: 'pending' | 'confirmed', clientId: number): void => {
        setChats(currentChats => currentChats?.map(chat => {
            if (chat.clientId === clientId) {
                return {
                    ...chat,
                    messages: chat.messages.map(message => {
                        if (message.tempMessageId === tempMessageId) {
                            return { ...message, status: newStatus };
                        }
                        return message;
                    }),
                };
            }
            return chat;
        }));
    };

    function reconnectWebSocket(wsRef: {current: {ws: WebSocket, pingInterval: number}}) {
        // Закрытие текущего соединения, если оно открыто
        if (wsRef.current.ws && wsRef.current.ws.readyState !== WebSocket.CLOSED) {
            wsRef.current.ws.close();
        }

        // Создание нового экземпляра WebSocket
        wsRef.current.ws = new WebSocket(wsURL);

        // Установка обработчиков событий для нового соединения
        setupWebSocketListeners(wsRef.current.ws, wsRef);
    }

    function setupWebSocketListeners(ws: WebSocket, wsRef: { current: {ws: WebSocket, pingInterval: number}}) {
        ws.onopen = () => {
            console.log("WebSocket соединение установлено");
            fetchChatHistory()
            wsRef.current!.pingInterval = setupPing(wsRef.current!.ws);
        };

        ws.onmessage = (event) => {
            const response: { action: string; data: any } = JSON.parse(event.data);
            console.log('Получено сообщение:', response);
            console.log('message')
            if (response.action === 'acknowledgeMessage') {
                console.log('UPDATE')
                updateMessageStatusInChatState(response.data.tempMessageId, 'confirmed', response.data.clientId);
            }
            else if (response.action === 'newMessage') {
                const data = JSON.parse(response.data)
                const tempMessageId: number = Date.now();
                const tempMessage: Message = {
                    messageId: tempMessageId,
                    message: data.message,
                    fromConsultant: false,
                    createdAt: (new Date()).toISOString(),
                    status: 'pending',
                    tempMessageId: tempMessageId, // Include the temporary ID
                };
                addMessageToChatState(tempMessage, data.userData.userId);
            }
            if (response.action === 'pong') {
                console.log("Получен 'понг', соединение активно");
            }
        };

        ws.onclose = () => {
            console.log("WebSocket соединение закрыто, инициация повторного подключения...");
            // Логика повторного подключения
            clearInterval(wsRef.current!.pingInterval);
            setTimeout(() => reconnectWebSocket(wsRef), 5000); // Пауза перед повторным подключением
        };

        ws.onerror = (error) => {
            console.error("Ошибка WebSocket соединения:", error);
            // Обработка ошибок
        };
    }

    useEffect(() => {
        const loadSuggestions = async () => {
            try {
                const fetchedSuggestions = await fetchSuggestions();
                console.log(fetchedSuggestions)
                setSuggestions(fetchedSuggestions);
            } catch (error) {
                console.error('Error loading suggestions:', error);
            }
        };

        loadSuggestions();

        // Call the function to fetch chat history
        if (!chats) {
            fetchChatHistory()
        }

        if (!wsRef.current.ws || wsRef.current!.ws.readyState === WebSocket.CLOSED) {
            // @ts-ignore
            reconnectWebSocket(wsRef);
        }

        // if (!wsRef.current.ws || wsRef.current!.ws.readyState === WebSocket.CLOSED) {
        //     wsRef.current!.ws = new WebSocket('ws://localhost:8080');
        //
        //     console.log("Установка WebSocket соединения");
        //     wsRef.current!.ws.onopen = () => {
        //         console.log("WebSocket соединение установлено");
        //         // Настройка пинга при открытии соединения
        //         wsRef.current!.pingInterval = setupPing(wsRef.current!.ws);
        //     }
        //
        //     wsRef.current!.ws.onclose = () => {
        //         console.log("WebSocket соединение закрыто");
        //         // Очистка интервала пинга при закрытии соединения
        //         clearInterval(wsRef.current!.pingInterval);
        //     };
        //
        //     wsRef.current!.ws.onmessage = (event: MessageEvent) => {
        //         const response: { action: string; data: any } = JSON.parse(event.data);
        //         console.log('message')
        //         if (response.action === 'acknowledgeMessage') {
        //             console.log('UPDATE')
        //             updateMessageStatusInChatState(response.data.tempMessageId, 'confirmed', response.data.clientId);
        //         }
        //         else if (response.action === 'newMessage') {
        //             const data = JSON.parse(response.data)
        //             const tempMessageId: number = Date.now();
        //             const tempMessage: Message = {
        //                 messageId: tempMessageId,
        //                 message: data.message,
        //                 fromConsultant: false,
        //                 createdAt: (new Date()).toISOString(),
        //                 status: 'pending',
        //                 tempMessageId: tempMessageId, // Include the temporary ID
        //             };
        //             addMessageToChatState(tempMessage, data.userData.userId);
        //         }
        //         if (response.action === 'pong') {
        //             console.log("Получен 'понг', соединение активно");
        //         }
        //     };
        // }

        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    }, [wsRef.current, chats, selectedChat]);

    const renderedMessages = chats?.find((chat) => chat.clientId === selectedChat?.clientId)?.
    messages.map((message, index, messagesArray) => {
        const createdAt = new Date(message.createdAt)
        const time = formatTime(createdAt)
        const url = selectedChat?.userInfo.profileImageId !== 'default' ? `${backendURL}/api/user/user-image/${selectedChat?.userInfo.profileImageId}`: 'https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png'
        const date = (
            <div className="sticky top-0 flex justify-center">
                <p className="text-center my-5 text-lg bg-gray-200 text-gray-600 px-10 py-1 rounded-full">
                    {formatDate(createdAt)}
                </p>
            </div>
        )
        let dateHeader = null

        if (index === 0) {
            dateHeader = date
        } else {
            const prevDate = new Date(messagesArray[index-1].createdAt)
            if ((prevDate.getDay() !== createdAt.getDay()) || (prevDate.getMonth() !== createdAt.getMonth())) {
                dateHeader = date
            }
        }

        // Функция для определения статуса сообщения
        const MessageStatus = ({ status }: {status: string}) => {
            if (status === 'pending') {
                return <IconCheck size={15} />;
            }
            return <IconChecks size={15} />;
        };

        // Функция для отображения времени и статуса сообщения
        const MessageInfo = ({ fromConsultant, status }: {fromConsultant: boolean, status: string}) => (
            <div className="flex items-end text-xs gap-2">
                {time}
                {fromConsultant && <MessageStatus status={status} />}
            </div>
        );

        return (
            <div>
                {dateHeader}
                <div key={message.messageId} className={`my-5 flex ${message.fromConsultant ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-end ${message.fromConsultant ? 'justify-end w-1/2' : 'w-1/2'}`}>
                        {message.fromConsultant || (
                            <img className="w-7 h-7 rounded-full" src={url} alt="profile_image" />
                        )}
                        <div className={`flex items-end gap-7 text-lg px-5 py-2 ${message.fromConsultant ? 'mr-5 bg-blue-500 text-white' : 'ml-5 bg-white'} rounded-lg border-[1px] border-gray-200`}>
                            <span>{message.message}</span>
                            <MessageInfo fromConsultant={message.fromConsultant} status={message.status} />
                        </div>
                        {message.fromConsultant && (
                            <img className="w-7 h-7 rounded-full" src='https://cdn-icons-png.flaticon.com/512/9131/9131529.png' alt="profile_image" />
                        )}
                    </div>
                </div>
            </div>
        );
    })

    const renderedChats = chats?.map((chat) => {
        const url = chat.userInfo.profileImageId !== 'default' ? `${backendURL}/api/user/user-image/${chat.userInfo.profileImageId}`: 'https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png'
        const time = formatTime(new Date(chat.messages[chat.messages.length-1].createdAt))

        if (searchValue) {
            console.log(chat.userInfo.firstName)
            if (chat.userInfo.firstName.toLowerCase().includes(searchValue.toLowerCase())) {
                return (
                    <div onClick={()=>{setSelectedChat(chat)}}
                         key={chat.clientId}
                         className={`${selectedChat?.clientId === chat.clientId ? 'bg-blue-100 border-2 border-blue-500' : 'bg-white'} mt-2 hover:border-blue-500 cursor-pointer transition flex items-center justify-between border-2 rounded-xl px-4 py-3`}>
                        <div className="flex gap-5">
                            <img
                                className={'w-12 h-12 rounded-full'}
                                src={url}
                                alt="profile_image"/>
                            <div>
                                <p className="text-lg">{chat.userInfo.firstName}</p>
                                <p className="text-gray-500 text-sm">{chat.messages[chat.messages.length-1].message}</p>
                            </div>
                        </div>
                        <div className={'flex flex-col gap-3'}>
                            <p className="text-xs">{time}</p>
                            {/*<p className="text-xs w-7 h-7 flex justify-center items-center rounded-full text-white bg-blue-500">5</p>*/}
                        </div>
                    </div>
                )
            }
        } else {
            return (
                <div onClick={()=>{setSelectedChat(chat)}}
                     key={chat.clientId}
                     className={`${selectedChat?.clientId === chat.clientId ? 'bg-blue-100 border-2 border-blue-500' : 'bg-white'} mt-2 hover:border-blue-500 cursor-pointer transition flex items-center justify-between border-2 rounded-xl px-4 py-3`}>
                    <div className="flex gap-5">
                        <img
                            className={'w-12 h-12 rounded-full'}
                            src={url}
                            alt="profile_image"/>
                        <div>
                            <p className="text-lg">{chat.userInfo.firstName}</p>
                            <p className="text-gray-500 text-sm">{chat.messages[chat.messages.length-1].message}</p>
                        </div>
                    </div>
                    <div className={'flex flex-col gap-3'}>
                        <p className="text-xs">{time}</p>
                        {/*<p className="text-xs w-7 h-7 flex justify-center items-center rounded-full text-white bg-blue-500">5</p>*/}
                    </div>
                </div>
            )
        }
    })
    const renderedSuggestions = suggestions?.map((suggestion) => {
        return (
            <div className={'mb-5'}>
                <div className="flex gap-3 items-center">
                    <p className="text-sm text-gray-500 font-bold">{suggestion.first_name} {suggestion.last_name}</p>
                </div>
                <div className="rounded-md border-[1px] bg-white border-gray-200 p-3 w-full">
                    <p className="inline-block text-sm rounded-full px-5 py-1 bg-gray-300 text-gray-700">{formatDate(new Date(suggestion.created_at))}, {formatTime(new Date(suggestion.created_at))}</p>
                    <p className="w-1/3 rounded-md mt-2 px-10 py-2 bg-blue-500 text-white">{suggestion.suggestion}</p>
                </div>
            </div>
        )
    })

    const sendMessage = (): void => {
        if (messageText !== '' && selectedChat) {
            const tempMessageId: number = Date.now();
            const tempMessage: Message = {
                messageId: tempMessageId,
                message: messageText,
                fromConsultant: true,
                createdAt: (new Date()).toISOString(),
                status: 'pending',
                tempMessageId: tempMessageId, // Include the temporary ID
            };

            addMessageToChatState(tempMessage, selectedChat.userInfo.userId);

            if (wsRef.current!.ws!.readyState === wsRef.current!.ws!.OPEN) {
                wsRef.current!.ws!.send(JSON.stringify({
                    action: 'sendMessage',
                    data: {
                        userId: selectedChat.userInfo.userId,
                        message: messageText,
                        clientId: selectedChat.clientId,
                        tempMessageId: tempMessageId,
                    },
                }));
            } else {
                wsRef.current!.ws!.onopen = () => {
                    wsRef.current!.ws!.send(JSON.stringify({
                        action: 'sendMessage',
                        data: {
                            userId: selectedChat.userInfo.userId,
                            message: messageText,
                            clientId: selectedChat.clientId,
                            tempMessageId: tempMessageId,
                        },
                    }));
                }
            }

            setMessageText('');
        }
    };

    return (
    <div className={'m-10 grid grid-cols-12 gap-5'}>
        <div className={'col-span-4 bg-gray-50 p-5 border-[1px] border-gray-300 rounded-xl'}>
            <p className="text-3xl">Chats</p>
            <div className="mt-5 flex px-5 justify-between py-2 gap-3 bg-white items-center border-[1px] border-gray-300 rounded-xl">
                <div className="flex items-center gap-3">
                    <MagnifyingGlassIcon className={'h-5 w-5'}/>
                    <input value={searchValue} onChange={(e) => {setSearchValue(e.target.value)}}
                           type="text" className={'placeholder-gray-500 pr-5 py-1 outline-none rounded-md'}
                           placeholder={'Поиск пользователей'}/>
                </div>
                <XMarkIcon onClick={()=>{setSearchValue('')}}
                           className={`${searchValue == '' && 'invisible'} h-5 w-5 cursor-pointer hover:text-blue-500 transition hover:scale-125`}/>
            </div>
            <div className="overflow-scroll parent overflow-y-visible h-[50vh] mt-10">
                {
                    chats?.length === 0 ? (
                        <div className="text-center text-gray-500">Пока что нету чатов</div>
                    ) : renderedChats
                }
            </div>
            <div onClick={()=>{setShowSuggestions(true); setSelectedChat(null)}}
                 className="px-10 py-3 flex gap-5 items-center bg-blue-500 rounded-lg text-white cursor-pointer hover:scale-105 transition">
                <IconBulb className={'h-10 w-10'}/>
                 Предложения пользователей по улучшению бота
            </div>
        </div>
        <div className={'col-span-8 bg-gray-50 p-5 border-[1px] border-gray-300 rounded-xl'}>
            {
                showSuggestions && !selectedChat ? (
                    <div className="h-[50vh] overflow-y-scroll border-2 border-gray-400 p-5 rounded-lg">
                        {
                            renderedSuggestions
                        }
                    </div>
                ) : selectedChat ? (
                    <>
                        <div className="flex gap-5 items-center border-b-2 pb-4">
                            <img
                                className={'w-12 h-12 rounded-full'}
                                src={selectedChat?.userInfo.profileImageId !== 'default' ? `${backendURL}/api/user/user-image/${selectedChat.userInfo.profileImageId}`: 'https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png'}
                                alt="profile_image"/>
                            <p className="text-xl">
                                {selectedChat.userInfo.firstName}
                            </p>
                        </div>
                        <div ref={scrollContainerRef} className="h-[50vh] relative overflow-y-scroll rounded-md mt-5 bg-white p-5 border-[1px] border-gray-300">
                            {renderedMessages}
                        </div>
                        <div className={'flex gap-5'}>
                        <textarea value={messageText} onChange={(e)=>{setMessageText(e.target.value)}}
                                  className="bg-white placeholder-gray-400 w-full py-5 px-10 mt-5 rounded-lg border-2 border-gray-200" placeholder={'Введите сообщение'}/>
                            <button
                                onClick={sendMessage}
                                className="bg-blue-500 text-white rounded-2xl py-4 mt-5 transform transition duration-150 ease-in-out shadow-push_button active:translate-y-1 px-10 flex items-center gap-5">
                                Отправить
                                <PaperAirplaneIcon className={'w-5 h-5'}/>
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex my-20 justify-center text-3xl text-gray-500">Выберите чат</div>
                )
            }
        </div>
    </div>
  );
}

export default App;
