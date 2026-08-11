import axios from "@/lib/axios";

class CommentService {
    commentsCount = async (id: string, type: string) =>
        await axios.get(`/comments/comments-count?${type}Id=${id}`);
    getComments = async (
        id: string,
        page: number,
        type: string,
        sentiment: string,
        userId?: string,
        limit: number = 10,
    ) =>
        await axios.get(
            `/comments/all-${type}-comments/${id}?page=${page}&limit=${limit}&sentiment=${sentiment}${userId ? `&userId=${userId}` : ''}`
        );
    comment = async (id: string, content: string, type: string) =>
        await axios.post(`/comments/add-comment-to-${type}/${id}`, { content });
    deleteComment = async (commentId: string) =>
        await axios.delete(`/comments/delete-comment/${commentId}`);
    updateComment = async (commentId: string, content: string) =>
        await axios.patch(`/comments/update-comment/${commentId}`, { content });
}

export const commentService = new CommentService();
