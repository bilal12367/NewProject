import { CircularProgress, IconButton, TextField } from '@mui/material'
import Avatar from '@mui/material/Avatar'
import { deepPurple, grey } from '@mui/material/colors'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import React, { Key, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { actions, useAppDispatch, useAppSelector } from '../../../store'
import { useGetChatQuery, useSendMessageMutation } from '../../../store/RTKQuery'
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SendIcon from '@mui/icons-material/Send';
import FilledInput from '@mui/material/FilledInput'
import OutlinedInput from '@mui/material/OutlinedInput'
import { useTheme } from '@mui/system'
import { useSocketContext } from '../../../store/SocketContext'
import MessageItem from '../../../components/MessageItem'

const ChatSection = () => {
    const { getSocket } = useSocketContext();
    const socket = getSocket();
    const { selectedChat, selectedChatData, user } = useAppSelector((state) => state.slice)
    let messageEnd: any;
    const theme = useTheme();
    const dispatch = useAppDispatch();
    const [sendMessageReq, sendMessageResp] = useSendMessageMutation();
    const [message, setMessage] = useState('')
    const getChatQuery = useGetChatQuery(selectedChat?.chat_id)

    // if (selectedChatData) {
    //     console.log("SelectedChatData: ", selectedChatData)
    //     console.log("SelectedChatDataMessages: ", selectedChatData.messages)
    // }

    useEffect(() => {
        if (selectedChat != null) {
            getChatQuery.refetch()
            socket.emit("join_room", {user: user?._id, roomId:  selectedChat._id})
            socket.on('update',(data: any)=> {
                console.log('data', data)
            })
            socket.on("message_update", (data: any) => {
                // messageEnd.scrollIntoView({ behavior: "smooth" });
                console.log('message update data: ', data)
                if (!selectedChatData?.messages.includes(data.message)) {
                    dispatch(actions.slice1.pushChatMessage(data.message))
                }
            })
        }
        return () => {
            console.log("Chat section exit invoked.")
            socket.emit("leave_room", {user: user?._id, roomId:  selectedChat?._id})
            socket.off("message_update")
        }
    }, [selectedChat])

    useEffect(() => {
        console.table(sendMessageResp)
        if (sendMessageResp.isLoading == false && sendMessageResp.isSuccess == true && sendMessageResp.status == 'fulfilled') {
            console.log("Send Message event triggered.")
            socket.emit("send_message", { message: sendMessageResp.data.message })
        }
    }, [sendMessageResp])
    const handleMessageInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.currentTarget.value;
        setMessage(value);
    }

    const sendMessage = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (message != '') {
            sendMessageReq({ chatId: selectedChat?._id, message, files: [] })
            // socket.to(selectedChat?.chat_id).emit({ chatId: selectedChat?._id, message, files: [] })
            // socket.emit("send_message",{chatId: selectedChat?.chat_id, message,files: []})
            setMessage('')
        }
    }

    if(getChatQuery.isSuccess == true){
        console.log('getChatQuery.data', getChatQuery.data)
    }
    return (
        <React.Fragment>
            <Grid item>
                <Paper sx={{ position: 'relative', zIndex: 2 }}>
                    <Grid container bgcolor='InfoBackground' direction='row' padding={2}>
                        <Grid container direction='row' justifyContent='flex-start'>
                            {getChatQuery.isLoading == true && <CircularProgress />}
                            {getChatQuery.isLoading == false && getChatQuery.isSuccess == true &&
                                <React.Fragment>
                                    <Grid item xs={0.5}>
                                        <Avatar sx={{ bgcolor: deepPurple[400] }}>{getChatQuery.data.team_name[0]}</Avatar>
                                    </Grid>
                                    <Grid item container marginLeft={2} direction='column' xs={4}>
                                        <Typography variant='body1'>{getChatQuery.data.team_name}</Typography>
                                        {/* <Typography color='grey' variant='body2'>{selectedUser?.email}</Typography> */}

                                    </Grid>
                                </React.Fragment>
                            }

                        </Grid>
                    </Grid>
                </Paper>
            </Grid>

            <Grid flexDirection='column' ref={(el) => { messageEnd = el; }} position='relative' zIndex={0} className='sc1' sx={{ height: '100%', overflowY: 'scroll' }} item bgcolor={grey[200]}>
                {
                    selectedChatData != null && Object.values(selectedChatData?.messages).map((item) => {
                        return <MessageItem key={item._id as Key} messageItem={item} />
                    })
                }
            </Grid>
            <Paper elevation={3}>
                <form onSubmit={sendMessage}>
                    <Grid display='flex' flexDirection='row' alignItems='center' paddingY={1.5} paddingX={1} position='relative' zIndex={2} bgcolor='white' >
                        <Grid item>
                            <IconButton size='large'>
                                <AttachFileIcon sx={{ transform: 'rotate(45deg)' }} />
                            </IconButton>
                        </Grid>
                        <Grid item flexGrow='1' paddingX={2} paddingY={0.4}>
                            <OutlinedInput value={message} onChange={handleMessageInput} sx={{ backgroundColor: theme.palette.grey[200], borderRadius: '205px' }} fullWidth={true} />
                        </Grid>
                        <Grid item>
                            <IconButton type='submit'>
                                <SendIcon fontSize='medium' />
                            </IconButton>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </React.Fragment>);
}

export default ChatSection